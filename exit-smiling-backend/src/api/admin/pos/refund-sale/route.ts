import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getStripeClient } from "../../../../lib/stripe"

function toPositiveNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

function toPositiveInt(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0
}

function normalizeHistory(value: any) {
  return Array.isArray(value) ? value : []
}

function getOrderItemTotal(item: any) {
  const directTotal = Number(item?.total || 0)

  if (Number.isFinite(directTotal) && directTotal > 0) {
    return directTotal
  }

  const metadataLineTotal = Number(item?.metadata?.line_total || 0)

  if (Number.isFinite(metadataLineTotal) && metadataLineTotal > 0) {
    return metadataLineTotal
  }

  const subtotal = Number(item?.subtotal || 0)
  const discountTotal = Number(item?.discount_total || 0)
  const fallback = subtotal - discountTotal

  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const actorId = (req as any)?.auth_context?.actor_id
    const body = (req.body || {}) as {
      order_id?: string
      payment_intent_id?: string
      amount?: number
      note?: string
      restock?: boolean
      request_key?: string
      items?: {
        order_item_id?: string
        quantity?: number
      }[]
    }

    const inputOrderId = String(body.order_id || "").trim()
    const inputPaymentIntentId = String(body.payment_intent_id || "").trim()
    const shouldRestock = body.restock !== false
    const requestKey = String(body.request_key || "").trim()
    const selectedItemsInput = Array.isArray(body.items) ? body.items : []

    if (!inputOrderId && !inputPaymentIntentId) {
      return res.status(400).json({
        message: "An order_id or payment_intent_id is required.",
      })
    }

    const stripe = getStripeClient()
    let paymentIntent = inputPaymentIntentId
      ? await stripe.paymentIntents.retrieve(inputPaymentIntentId)
      : null

    const resolvedOrderId =
      inputOrderId || String(paymentIntent?.metadata?.medusa_order_id || "").trim()

    if (!resolvedOrderId) {
      return res.status(404).json({
        message: "No Medusa order could be resolved for this POS sale.",
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const inventoryService = req.scope.resolve(Modules.INVENTORY)
    const locking = req.scope.resolve(Modules.LOCKING)
    const orderService = req.scope.resolve(Modules.ORDER)
    const paymentModule = req.scope.resolve(Modules.PAYMENT) as any

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "total",
        "currency_code",
        "metadata",
        "items.id",
        "items.title",
        "items.variant_id",
        "items.quantity",
        "items.metadata",
        "items.subtotal",
        "items.discount_total",
        "items.total",
        "items.detail.quantity",
        "payment_collections.id",
        "payment_collections.amount",
        "payment_collections.refunded_amount",
        "payment_collections.status",
        "payment_collections.payments.id",
        "payment_collections.payments.amount",
        "payment_collections.payments.currency_code",
      ],
      filters: {
        id: resolvedOrderId,
      },
      pagination: {
        take: 1,
      },
    })

    const order = orders?.[0] as any

    if (!order?.id) {
      return res.status(404).json({
        message: `Order ${resolvedOrderId} was not found.`,
      })
    }

    const orderPaymentCollection = (order.payment_collections || [])[0]
    const payment = (orderPaymentCollection?.payments || [])[0]
    const paymentMethod = String(order?.metadata?.pos_payment_method || "").trim()
    const isCashSale = paymentMethod === "cash"
    const isComplimentarySale = paymentMethod === "complimentary"
    const isNonStripeSale = isCashSale || isComplimentarySale

    if (!payment?.id && !isComplimentarySale) {
      return res.status(409).json({
        message: "No payment record was found on this POS order.",
      })
    }

    const resolvedPaymentIntentId =
      inputPaymentIntentId || String(order?.metadata?.stripe_payment_intent_id || "").trim()

    if (!paymentIntent && resolvedPaymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId)
    }

    if (!paymentIntent?.id && !isNonStripeSale) {
      return res.status(409).json({
        message: "No Stripe payment intent was found for this POS order.",
      })
    }

    const stripePaymentIntentId = paymentIntent?.id || ""

    const refundHistory = normalizeHistory(order?.metadata?.pos_refund_history)
    const selectedItems = selectedItemsInput
      .map((item) => ({
        order_item_id: String(item?.order_item_id || "").trim(),
        quantity: toPositiveInt(item?.quantity),
      }))
      .filter((item) => item.order_item_id && item.quantity > 0)

    if (requestKey) {
      const existingEntry = refundHistory.find((entry: any) => entry?.request_key === requestKey)

      if (existingEntry) {
        return res.status(200).json({
          ok: true,
          already_processed: true,
          order_id: order.id,
          payment_id: payment.id,
          refunded_amount: Number(existingEntry.refunded_amount || 0),
          restocked: Boolean(existingEntry.restocked),
          adjusted_levels: Number(existingEntry.adjusted_levels || 0),
        })
      }
    }

    const refundedQuantitiesByItem = refundHistory.reduce((acc: Map<string, number>, entry: any) => {
      for (const item of entry?.items || []) {
        const itemId = String(item?.order_item_id || "").trim()
        const qty = toPositiveInt(item?.quantity)
        if (!itemId || qty <= 0) continue
        acc.set(itemId, (acc.get(itemId) || 0) + qty)
      }
      return acc
    }, new Map<string, number>())

    let derivedRefundAmount = 0

    if (selectedItems.length) {
      for (const selectedItem of selectedItems) {
        const orderItem = (order.items || []).find((item: any) => item.id === selectedItem.order_item_id)

        if (!orderItem) {
          return res.status(404).json({
            message: `Order item ${selectedItem.order_item_id} was not found on this POS order.`,
          })
        }

        const soldQuantity = toPositiveInt(orderItem?.detail?.quantity || orderItem?.quantity)
        const alreadyRefundedQty = refundedQuantitiesByItem.get(orderItem.id) || 0
        const remainingQty = Math.max(0, soldQuantity - alreadyRefundedQty)

        if (selectedItem.quantity > remainingQty) {
          return res.status(400).json({
            message: `Only ${remainingQty} refundable unit(s) remain for ${orderItem.title}.`,
          })
        }

        const lineTotal = getOrderItemTotal(orderItem)
        const unitAmount = soldQuantity > 0 ? lineTotal / soldQuantity : 0

        derivedRefundAmount += unitAmount * selectedItem.quantity
      }
    }

    const refundAmount =
      selectedItems.length
        ? Number(derivedRefundAmount.toFixed(2))
        : toPositiveNumber(body.amount) || Number(orderPaymentCollection?.amount || order.total || 0)
    const fullRefundAmount = Number(orderPaymentCollection?.amount || order.total || 0)
    const isFullRefund = Math.abs(refundAmount - fullRefundAmount) < 0.0001

    if (refundAmount <= 0 && !isComplimentarySale) {
      return res.status(400).json({
        message: "The selected refund amount resolved to zero. Refresh the sale and try again.",
      })
    }

    if (shouldRestock && !isFullRefund && !selectedItems.length) {
      return res.status(400).json({
        message:
          "Automatic restock is only supported for full refunds right now. Pass restock=false for a partial refund.",
      })
    }

    const refundNote = String(body.note || "POS refund").trim() || "POS refund"
    if (!isNonStripeSale) {
      const requestedRefundCents = Math.round(refundAmount * 100)
      const stripeRefunds = await stripe.refunds.list({
        payment_intent: stripePaymentIntentId,
        limit: 100,
      })
      const stripeAlreadyRefundedCents = (stripeRefunds.data || []).reduce((sum, refund) => {
        if (refund.status === "failed" || refund.status === "canceled") {
          return sum
        }

        return sum + Number(refund.amount || 0)
      }, 0)

      const stripeRefundCents = Math.max(0, requestedRefundCents - stripeAlreadyRefundedCents)

      if (stripeRefundCents > 0) {
        await stripe.refunds.create({
          payment_intent: stripePaymentIntentId,
          amount: stripeRefundCents,
          metadata: {
            pos_mode: "ipad_terminal",
            medusa_order_id: order.id,
            reason_note: refundNote,
            refund_request_key: requestKey,
          },
        })
      }
    }

    const medusaAlreadyRefunded = Number(orderPaymentCollection?.refunded_amount || 0)
    const medusaRefundAmount = Math.max(0, refundAmount - medusaAlreadyRefunded)

    if (medusaRefundAmount > 0 && payment?.id) {
      await paymentModule.createRefunds({
        payment: payment.id,
        amount: medusaRefundAmount,
        created_by: actorId,
        note: refundNote,
        metadata: {
          pos_mode: "ipad_terminal",
          stripe_payment_intent_id: stripePaymentIntentId,
          refund_request_key: requestKey,
        },
      })

      await paymentModule.updatePaymentCollections(orderPaymentCollection.id, {
        refunded_amount: Number((medusaAlreadyRefunded + medusaRefundAmount).toFixed(2)),
      })
    }

    let adjustedLevels = 0

    if (shouldRestock && (isFullRefund || selectedItems.length)) {
      const restockAlreadySynced =
        !selectedItems.length && paymentIntent?.metadata?.medusa_pos_full_refund_restocked === "true"

      if (!restockAlreadySynced) {
        const variantQuantityMap = new Map<string, number>()

        const itemsToRestock = selectedItems.length
          ? (order.items || []).filter((item: any) =>
              selectedItems.some((selectedItem) => selectedItem.order_item_id === item.id)
            )
          : order.items || []

        for (const item of itemsToRestock) {
          const variantId = String(item?.variant_id || "").trim()
          const quantity = selectedItems.length
            ? selectedItems.find((selectedItem) => selectedItem.order_item_id === item.id)?.quantity || 0
            : toPositiveInt(item?.detail?.quantity)

          if (!variantId || quantity <= 0) {
            continue
          }

          variantQuantityMap.set(variantId, (variantQuantityMap.get(variantId) || 0) + quantity)
        }

        const variantIds = Array.from(variantQuantityMap.keys())

        if (variantIds.length) {
          const { data: variants } = await query.graph({
            entity: "product_variant",
            fields: [
              "id",
              "title",
              "manage_inventory",
              "inventory_items.inventory_item_id",
              "inventory_items.required_quantity",
              "inventory_items.inventory.location_levels.location_id",
              "inventory_items.inventory.location_levels.stocked_quantity",
              "inventory_items.inventory.location_levels.reserved_quantity",
            ],
            filters: {
              id: variantIds,
            },
            pagination: {
              take: variantIds.length,
            },
          })

          const variantsById = new Map((variants || []).map((variant: any) => [variant.id, variant]))
          const adjustments: { inventory_item_id: string; location_id: string; adjustment: number }[] = []

          for (const [variantId, refundedQuantity] of variantQuantityMap.entries()) {
            const variant = variantsById.get(variantId)

            if (!variant || !variant.manage_inventory) {
              continue
            }

            for (const inventoryLink of variant.inventory_items || []) {
              const inventoryItemId = String(inventoryLink?.inventory_item_id || "").trim()
              const requiredPerUnit = Math.max(1, toPositiveInt(inventoryLink?.required_quantity) || 1)
              const restockTotal = requiredPerUnit * refundedQuantity

              if (!inventoryItemId || restockTotal <= 0) {
                continue
              }

              const locationLevels = (inventoryLink?.inventory?.location_levels || [])
                .map((level: any) => ({
                  location_id: String(level?.location_id || "").trim(),
                  stocked: Number(level?.stocked_quantity || 0),
                }))
                .filter((level: any) => level.location_id)
                .sort((a: any, b: any) => b.stocked - a.stocked)

              const fallbackLocationId = locationLevels[0]?.location_id

              if (!fallbackLocationId) {
                return res.status(409).json({
                  message: `No inventory location was found to restock variant ${variant.title || variantId}.`,
                })
              }

              adjustments.push({
                inventory_item_id: inventoryItemId,
                location_id: fallbackLocationId,
                adjustment: restockTotal,
              })
            }
          }

          if (adjustments.length) {
            const lockingKeys = Array.from(
              new Set(adjustments.map((entry) => entry.inventory_item_id))
            )

            await locking.execute(lockingKeys, async () => {
              await inventoryService.adjustInventory(
                adjustments.map((entry) => ({
                  inventoryItemId: entry.inventory_item_id,
                  locationId: entry.location_id,
                  adjustment: entry.adjustment,
                }))
              )
            })
          }

          adjustedLevels = adjustments.length
        }

        if (paymentIntent && !selectedItems.length) {
          await stripe.paymentIntents.update(paymentIntent.id, {
            metadata: {
              ...paymentIntent.metadata,
              medusa_pos_full_refund_restocked: "true",
              medusa_pos_full_refund_restocked_at: new Date().toISOString(),
            },
          })
        }
      }
    }

    if (requestKey) {
      await orderService.updateOrders(order.id, {
        metadata: {
          ...(order.metadata || {}),
          pos_refund_history: [
            ...refundHistory,
            {
              request_key: requestKey,
              refunded_amount: refundAmount,
              restocked: shouldRestock && (isFullRefund || selectedItems.length),
              adjusted_levels: adjustedLevels,
              note: refundNote,
              created_at: new Date().toISOString(),
              items: selectedItems,
            },
          ],
        },
      })
    }

    return res.status(200).json({
      ok: true,
      order_id: order.id,
      payment_id: payment?.id || null,
      refunded_amount: refundAmount,
      restocked: shouldRestock && (isFullRefund || selectedItems.length > 0),
      adjusted_levels: adjustedLevels,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to refund and restock POS sale.",
    })
  }
}
