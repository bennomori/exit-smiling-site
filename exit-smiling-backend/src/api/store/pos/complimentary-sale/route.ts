import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createOrderPaymentCollectionWorkflow,
  createOrderWorkflow,
  markPaymentCollectionAsPaid,
} from "@medusajs/core-flows"
import { sendOrderAlert } from "../../../../lib/order-alerts"

type ComplimentarySaleItem = {
  variant_id?: string
  quantity?: number
  title?: string
  variant_title?: string
  unit_price?: number
  discount_percent?: number
  discount_amount?: number
  line_total?: number
  complimentary_tag?: string
}

type PosDeliveryPayload = {
  required?: boolean
  address?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
    phone?: string
  } | null
}

function toPositiveInt(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0
}

function normalizeDelivery(value: any): PosDeliveryPayload {
  const required = Boolean(value?.required)

  if (!required) {
    return { required: false, address: null }
  }

  const address = value?.address || {}

  return {
    required: true,
    address: {
      first_name: String(address?.first_name || "").trim(),
      last_name: String(address?.last_name || "").trim(),
      address_1: String(address?.address_1 || "").trim(),
      address_2: String(address?.address_2 || "").trim(),
      city: String(address?.city || "").trim(),
      province: String(address?.province || "").trim(),
      postal_code: String(address?.postal_code || "").trim(),
      country_code: String(address?.country_code || "au").trim().toLowerCase(),
      phone: String(address?.phone || "").trim(),
    },
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      items?: ComplimentarySaleItem[]
      receipt_email?: string
      customer_mobile?: string
      operator_name?: string
      event_name?: string
      note?: string
      delivery?: PosDeliveryPayload
    }

    const rawItems = Array.isArray(body.items) ? body.items : []
    const receiptEmail = String(body.receipt_email || "").trim().toLowerCase()
    const customerMobile = String(body.customer_mobile || "").trim()
    const operatorName = String(body.operator_name || "").trim()
    const eventName = String(body.event_name || "").trim()
    const note = String(body.note || "").trim()
    const delivery = normalizeDelivery(body.delivery)

    const items = rawItems
      .map((item) => ({
        variant_id: String(item?.variant_id || "").trim(),
        quantity: toPositiveInt(item?.quantity),
      }))
      .filter((item) => item.variant_id && item.quantity > 0)

    if (!items.length) {
      return res.status(400).json({ message: "At least one complimentary sale item is required." })
    }

    const saleTotal = rawItems.reduce((sum, item) => sum + Number(item?.line_total || 0), 0)
    const hasComplimentaryItems = rawItems.some((item) => String(item?.complimentary_tag || "").trim())

    if (!hasComplimentaryItems) {
      return res.status(400).json({
        message: "Mark at least one item as a giveaway or event organiser freebie first.",
      })
    }

    if (Math.abs(saleTotal) > 0.0001) {
      return res.status(400).json({
        message: "Complimentary sales require the cart total to be zero.",
      })
    }

    const variantQuantityMap = new Map<string, number>()

    for (const item of items) {
      variantQuantityMap.set(
        item.variant_id,
        (variantQuantityMap.get(item.variant_id) || 0) + item.quantity
      )
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const inventoryService = req.scope.resolve(Modules.INVENTORY)
    const locking = req.scope.resolve(Modules.LOCKING)
    const variantIds = Array.from(variantQuantityMap.keys())

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "title",
        "manage_inventory",
        "allow_backorder",
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

    for (const [variantId, soldQuantity] of variantQuantityMap.entries()) {
      const variant = variantsById.get(variantId)

      if (!variant) {
        return res.status(404).json({
          message: `Variant ${variantId} was not found for complimentary sale finalization.`,
        })
      }

      if (!variant.manage_inventory) {
        continue
      }

      for (const inventoryLink of variant.inventory_items || []) {
        const inventoryItemId = String(inventoryLink?.inventory_item_id || "").trim()
        const requiredPerUnit = Math.max(1, toPositiveInt(inventoryLink?.required_quantity) || 1)
        const requiredTotal = requiredPerUnit * soldQuantity

        if (!inventoryItemId || requiredTotal <= 0) {
          continue
        }

        const locationLevels = (inventoryLink?.inventory?.location_levels || [])
          .map((level: any) => {
            const stocked = Number(level?.stocked_quantity || 0)
            const reserved = Number(level?.reserved_quantity || 0)
            return {
              location_id: String(level?.location_id || "").trim(),
              available: stocked - reserved,
            }
          })
          .filter((level: any) => level.location_id)
          .sort((a: any, b: any) => b.available - a.available)

        const totalAvailable = locationLevels.reduce(
          (sum: number, level: any) => sum + Math.max(0, Number(level.available || 0)),
          0
        )

        if (!variant.allow_backorder && totalAvailable < requiredTotal) {
          return res.status(409).json({
            message: `Insufficient inventory to finalize complimentary sale for variant ${variant.title || variantId}.`,
          })
        }

        let remaining = requiredTotal

        for (const level of locationLevels) {
          if (remaining <= 0) break

          const availableHere = Math.max(0, Number(level.available || 0))
          const allocated = variant.allow_backorder
            ? Math.min(remaining, Math.max(availableHere, remaining))
            : Math.min(remaining, availableHere)

          if (allocated <= 0) continue

          adjustments.push({
            inventory_item_id: inventoryItemId,
            location_id: level.location_id,
            adjustment: -allocated,
          })

          remaining -= allocated
        }

        if (remaining > 0) {
          const fallbackLocationId = locationLevels[0]?.location_id

          if (!variant.allow_backorder || !fallbackLocationId) {
            return res.status(409).json({
              message: `Unable to allocate inventory adjustment for variant ${variant.title || variantId}.`,
            })
          }

          adjustments.push({
            inventory_item_id: inventoryItemId,
            location_id: fallbackLocationId,
            adjustment: -remaining,
          })
        }
      }
    }

    if (adjustments.length) {
      const lockingKeys = Array.from(new Set(adjustments.map((entry) => entry.inventory_item_id)))

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

    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: {
        currency_code: "aud",
      },
      pagination: {
        take: 1,
      },
    })

    const region = regions?.[0]

    if (!region?.id) {
      return res.status(500).json({
        message: "No region was found for AUD complimentary sale creation.",
      })
    }

    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name"],
      pagination: {
        take: 1,
      },
    })

    const salesChannel = salesChannels?.[0]

    if (!salesChannel?.id) {
      return res.status(500).json({
        message: "No sales channel was found for complimentary sale order creation.",
      })
    }

    const complimentaryTagSummary = Array.from(
      new Set(
        rawItems
          .map((item) => String(item?.complimentary_tag || "").trim())
          .filter(Boolean)
      )
    )

    const orderItems = rawItems
      .map((item) => ({
        variant_id: String(item?.variant_id || "").trim(),
        quantity: toPositiveInt(item?.quantity),
        title:
          String(item?.title || "").trim() ||
          String(item?.variant_title || "").trim() ||
          String(item?.variant_id || "").trim(),
        unit_price: 0,
        metadata: {
          pos_mode: "ipad_terminal",
          variant_title: String(item?.variant_title || "").trim(),
          discount_percent: Number(item?.discount_percent || 0),
          discount_amount: Number(item?.discount_amount || 0),
          line_total: Number(item?.line_total || 0),
          complimentary_tag: String(item?.complimentary_tag || "").trim(),
        },
      }))
      .filter((item) => item.variant_id && item.quantity > 0)

    const complimentarySaleReference = `comp-${Date.now()}`

    const { result: createdOrder } = await createOrderWorkflow(req.scope).run({
      input: {
        region_id: region.id,
        sales_channel_id: salesChannel.id,
        currency_code: "aud",
        email: receiptEmail || undefined,
        status: "pending",
        items: orderItems,
        shipping_address: delivery.required && delivery.address ? delivery.address : undefined,
        billing_address: delivery.required && delivery.address ? delivery.address : undefined,
        metadata: {
          pos_mode: "ipad_terminal",
          pos_payment_method: "complimentary",
          complimentary_sale_reference: complimentarySaleReference,
          complimentary_tags: complimentaryTagSummary,
          complimentary_note: note,
          customer_mobile: customerMobile,
          operator_name: operatorName,
          event_name: eventName,
          delivery_required: delivery.required ? "true" : "false",
          delivery_address: delivery.address || null,
          cart_subtotal_display: "$0.00",
          cart_discount_display: "$0.00",
          cart_total_display: "$0.00",
        },
      },
    })

    const createdOrderId = String(createdOrder?.id || "").trim()
    let paymentCollectionId = ""

    if (createdOrderId) {
      const { result: paymentCollections } = await createOrderPaymentCollectionWorkflow(req.scope).run({
        input: {
          order_id: createdOrderId,
          amount: 0,
        },
      })

      paymentCollectionId = String(paymentCollections?.[0]?.id || "").trim()

      if (paymentCollectionId) {
        await markPaymentCollectionAsPaid(req.scope).run({
          input: {
            order_id: createdOrderId,
            payment_collection_id: paymentCollectionId,
          },
        })
      }
    }

    if (createdOrderId) {
      try {
        await sendOrderAlert(req.scope, createdOrderId, { source: "POS complimentary" })
      } catch (alertError) {
        console.error("Failed to send POS complimentary order alert", alertError)
      }
    }

    return res.status(200).json({
      ok: true,
      order_id: createdOrderId || null,
      payment_collection_id: paymentCollectionId || null,
      adjusted_levels: adjustments.length,
      complimentary_sale_reference: complimentarySaleReference,
      complimentary_tags: complimentaryTagSummary,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to record complimentary sale.",
    })
  }
}
