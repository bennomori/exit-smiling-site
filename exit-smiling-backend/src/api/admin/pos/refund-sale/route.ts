import { refundPaymentWorkflow } from "@medusajs/core-flows"
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const actorId = (req as any)?.auth_context?.actor_id
    const body = (req.body || {}) as {
      order_id?: string
      payment_intent_id?: string
      amount?: number
      note?: string
      restock?: boolean
    }

    const inputOrderId = String(body.order_id || "").trim()
    const inputPaymentIntentId = String(body.payment_intent_id || "").trim()
    const shouldRestock = body.restock !== false

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

    if (!payment?.id) {
      return res.status(409).json({
        message: "No payment record was found on this POS order.",
      })
    }

    const resolvedPaymentIntentId =
      inputPaymentIntentId || String(order?.metadata?.stripe_payment_intent_id || "").trim()

    if (!paymentIntent && resolvedPaymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId)
    }

    if (!paymentIntent?.id) {
      return res.status(409).json({
        message: "No Stripe payment intent was found for this POS order.",
      })
    }

    const refundAmount =
      toPositiveNumber(body.amount) || Number(orderPaymentCollection?.amount || order.total || 0)
    const fullRefundAmount = Number(orderPaymentCollection?.amount || order.total || 0)
    const isFullRefund = Math.abs(refundAmount - fullRefundAmount) < 0.0001

    if (shouldRestock && !isFullRefund) {
      return res.status(400).json({
        message:
          "Automatic restock is only supported for full refunds right now. Pass restock=false for a partial refund.",
      })
    }

    const refundNote = String(body.note || "POS refund").trim() || "POS refund"
    const requestedRefundCents = Math.round(refundAmount * 100)
    const stripeRefunds = await stripe.refunds.list({
      payment_intent: paymentIntent.id,
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
        payment_intent: paymentIntent.id,
        amount: stripeRefundCents,
        metadata: {
          pos_mode: "ipad_terminal",
          medusa_order_id: order.id,
          reason_note: refundNote,
        },
      })
    }

    const medusaAlreadyRefunded = Number(orderPaymentCollection?.refunded_amount || 0)
    const medusaRefundAmount = Math.max(0, refundAmount - medusaAlreadyRefunded)

    if (medusaRefundAmount > 0) {
      await refundPaymentWorkflow(req.scope).run({
        input: {
          payment_id: payment.id,
          amount: medusaRefundAmount,
          note: refundNote,
          created_by: actorId,
        },
      })
    }

    let adjustedLevels = 0

    if (shouldRestock && isFullRefund) {
      const restockAlreadySynced =
        paymentIntent?.metadata?.medusa_pos_full_refund_restocked === "true"

      if (!restockAlreadySynced) {
        const variantQuantityMap = new Map<string, number>()

        for (const item of order.items || []) {
          const variantId = String(item?.variant_id || "").trim()
          const quantity = toPositiveInt(item?.detail?.quantity)

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

        if (paymentIntent) {
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

    return res.status(200).json({
      ok: true,
      order_id: order.id,
      payment_id: payment.id,
      refunded_amount: refundAmount,
      restocked: shouldRestock && isFullRefund,
      adjusted_levels: adjustedLevels,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to refund and restock POS sale.",
    })
  }
}
