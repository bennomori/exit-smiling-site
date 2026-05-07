import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function toQuantity(item: any) {
  const quantity = Number(item?.detail?.quantity ?? item?.quantity ?? 0)

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
}

function shouldCountOrder(order: any) {
  const status = String(order?.status || "").toLowerCase()
  const paymentStatus = String(order?.payment_status || "").toLowerCase()

  if (status === "canceled" || status === "cancelled") return false
  if (paymentStatus === "canceled" || paymentStatus === "cancelled") return false

  return true
}

function normalizeTitle(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const take = 500
    let skip = 0
    const orders: any[] = []

    while (true) {
      const { data: batch } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "status",
          "payment_status",
          "items.id",
          "items.title",
          "items.variant_id",
          "items.variant.id",
          "items.quantity",
          "items.detail.quantity",
        ],
        pagination: {
          take,
          skip,
        },
      })

      orders.push(...(batch || []))

      if (!batch?.length || batch.length < take) {
        break
      }

      skip += take
    }

    const variantUnitsSold = new Map<string, number>()
    const titleUnitsSold = new Map<string, number>()
    let countedOrderCount = 0

    for (const order of orders || []) {
      if (!shouldCountOrder(order)) {
        continue
      }

      countedOrderCount += 1

      for (const item of order?.items || []) {
        const variantId = String(item?.variant_id || item?.variant?.id || "").trim()
        const title = normalizeTitle(item?.title)
        const quantity = toQuantity(item)

        if (quantity <= 0) {
          continue
        }

        if (variantId) {
          variantUnitsSold.set(variantId, (variantUnitsSold.get(variantId) || 0) + quantity)
        }

        if (title) {
          titleUnitsSold.set(title, (titleUnitsSold.get(title) || 0) + quantity)
        }
      }
    }

    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.id",
      ],
      pagination: {
        take: 1000,
      },
    })

    const productUnitsSold = new Map<string, number>()

    for (const product of products || []) {
      const variantTotal = (product?.variants || []).reduce(
        (total: number, variant: any) =>
          total + (variantUnitsSold.get(String(variant?.id || "").trim()) || 0),
        0
      )
      const titleTotal = titleUnitsSold.get(normalizeTitle(product?.title)) || 0

      productUnitsSold.set(String(product?.id || ""), Math.max(variantTotal, titleTotal))
    }

    res.json({
      product_units_sold: Object.fromEntries(productUnitsSold),
      variant_units_sold: Object.fromEntries(variantUnitsSold),
      product_title_units_sold: Object.fromEntries(titleUnitsSold),
      order_count: orders.length,
      counted_order_count: countedOrderCount,
      generated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    res.status(500).json({
      message: error?.message || "Failed to load product sales ranking.",
    })
  }
}
