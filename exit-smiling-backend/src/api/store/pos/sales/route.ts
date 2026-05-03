import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function toNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function getRefundedAmount(order: any) {
  return (order?.payment_collections || []).reduce(
    (sum: number, collection: any) => sum + toNumber(collection?.refunded_amount),
    0
  )
}

function getCollectedAmount(order: any) {
  return (order?.payment_collections || []).reduce(
    (sum: number, collection: any) => sum + toNumber(collection?.amount),
    0
  )
}

function getItemTotal(order: any) {
  return (order?.items || []).reduce(
    (sum: number, item: any) => sum + toNumber(item?.total),
    0
  )
}

function getUnitsSold(order: any) {
  return (order?.items || []).reduce(
    (sum: number, item: any) => sum + Number(item?.detail?.quantity || item?.quantity || 0),
    0
  )
}

function getSaleLabel(order: any) {
  return order?.metadata?.event_name || order?.metadata?.operator_name || "POS sale"
}

function toPositiveInt(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0
}

function normalizeHistory(value: any) {
  return Array.isArray(value) ? value : []
}

function getOrderItemTotal(item: any) {
  const directTotal = toNumber(item?.total)

  if (directTotal > 0) {
    return directTotal
  }

  const metadataLineTotal = toNumber(item?.metadata?.line_total)

  if (metadataLineTotal > 0) {
    return metadataLineTotal
  }

  const subtotal = toNumber(item?.subtotal)
  const discountTotal = toNumber(item?.discount_total)
  const fallback = subtotal - discountTotal

  return fallback > 0 ? fallback : 0
}

function normalizeKey(value: unknown) {
  return String(value || "").trim()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 30)))
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "currency_code",
        "total",
        "payment_status",
        "metadata",
        "items.id",
        "items.title",
        "items.variant_title",
        "items.metadata",
        "items.quantity",
        "items.detail.quantity",
        "items.subtotal",
        "items.discount_total",
        "items.total",
        "payment_collections.id",
        "payment_collections.amount",
        "payment_collections.refunded_amount",
      ],
      pagination: {
        take: limit * 4,
      },
    })

    const posOrders = (orders || [])
      .filter((order: any) => order?.metadata?.pos_mode === "ipad_terminal")
      .sort(
        (a: any, b: any) =>
          new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
      )
      .slice(0, limit)

    const sales = posOrders.map((order: any) => {
      const refundedAmount = getRefundedAmount(order)
      const total =
        toNumber(order?.total) ||
        getCollectedAmount(order) ||
        getItemTotal(order)
      const netTotal = Math.max(0, total - refundedAmount)
      const unitsSold = getUnitsSold(order)
      const refundHistory = normalizeHistory(order?.metadata?.pos_refund_history)
      const refundedQuantitiesByItem = refundHistory.reduce((acc: Map<string, number>, entry: any) => {
        for (const item of entry?.items || []) {
          const itemId = String(item?.order_item_id || "").trim()
          const quantity = toPositiveInt(item?.quantity)

          if (!itemId || quantity <= 0) {
            continue
          }

          acc.set(itemId, (acc.get(itemId) || 0) + quantity)
        }

        return acc
      }, new Map<string, number>())

      return {
        id: order.id,
        display_id: order.display_id,
        created_at: order.created_at,
        email: order.email || "",
        currency_code: order.currency_code,
        total,
        refunded_amount: refundedAmount,
        net_total: netTotal,
        units_sold: unitsSold,
        payment_status: order.payment_status || "",
        payment_method: order.metadata?.pos_payment_method || "card",
        operator_name: order.metadata?.operator_name || "",
        event_name: order.metadata?.event_name || "",
        payment_intent_id: order.metadata?.stripe_payment_intent_id || "",
        reader_id: order.metadata?.pos_reader_id || "",
        cash_sale_reference: order.metadata?.cash_sale_reference || "",
        cash_received_amount: toNumber(order.metadata?.cash_received_amount),
        cash_change_given: toNumber(order.metadata?.cash_change_given),
        cash_note: order.metadata?.cash_note || "",
        delivery_required: String(order.metadata?.delivery_required || "").trim() === "true",
        delivery_address: order.metadata?.delivery_address || null,
        complimentary_sale_reference: order.metadata?.complimentary_sale_reference || "",
        complimentary_tags: Array.isArray(order.metadata?.complimentary_tags)
          ? order.metadata.complimentary_tags
          : [],
        complimentary_note: order.metadata?.complimentary_note || "",
        cart_subtotal_display: order.metadata?.cart_subtotal_display || "",
        cart_discount_display: order.metadata?.cart_discount_display || "",
        cart_total_display: order.metadata?.cart_total_display || "",
        label: getSaleLabel(order),
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          variant_title: item.variant_title || item.metadata?.variant_title || "",
          quantity: Number(item?.detail?.quantity || item?.quantity || 0),
          refunded_quantity: refundedQuantitiesByItem.get(item.id) || 0,
          refundable_quantity: Math.max(
            0,
            Number(item?.detail?.quantity || item?.quantity || 0) - (refundedQuantitiesByItem.get(item.id) || 0)
          ),
          subtotal: toNumber(item?.subtotal),
          discount_total: toNumber(item?.discount_total),
          discount_percent: toNumber(item?.metadata?.discount_percent),
          line_total: toNumber(item?.metadata?.line_total),
          complimentary_tag: String(item?.metadata?.complimentary_tag || ""),
          total: getOrderItemTotal(item),
        })),
        refund_history: refundHistory.map((entry: any) => ({
          request_key: String(entry?.request_key || ""),
          refunded_amount: toNumber(entry?.refunded_amount),
          restocked: Boolean(entry?.restocked),
          adjusted_levels: Number(entry?.adjusted_levels || 0),
          note: String(entry?.note || ""),
          created_at: String(entry?.created_at || ""),
          items: Array.isArray(entry?.items)
            ? entry.items.map((item: any) => ({
                order_item_id: String(item?.order_item_id || ""),
                quantity: Number(item?.quantity || 0),
              }))
            : [],
        })),
      }
    })

    const totals = sales.reduce(
      (acc, sale) => {
        acc.gross_total += sale.total
        acc.refunded_total += sale.refunded_amount
        acc.net_total += sale.net_total
        acc.units_sold += sale.units_sold
        return acc
      },
      {
        gross_total: 0,
        refunded_total: 0,
        net_total: 0,
        units_sold: 0,
      }
    )

    const todaySales = sales.filter((sale) => new Date(sale.created_at) >= startOfToday)
    const todayDiscountTotal = todaySales.reduce(
      (sum, sale) =>
        sum +
        (sale.items || []).reduce(
          (itemSum: number, item: any) => itemSum + toNumber(item.discount_total),
          0
        ),
      0
    )
    const todayRefundEvents = todaySales.reduce(
      (sum, sale) => sum + Number((sale.refund_history || []).length || 0),
      0
    )
    const today = todaySales.reduce(
      (acc, sale) => {
        acc.order_count += 1
        acc.gross_total += sale.total
        acc.refunded_total += sale.refunded_amount
        acc.net_total += sale.net_total
        acc.units_sold += sale.units_sold
        return acc
      },
      {
        order_count: 0,
        gross_total: 0,
        refunded_total: 0,
        net_total: 0,
        units_sold: 0,
      }
    )
    const todayByPaymentMethod = todaySales.reduce(
      (acc, sale) => {
        const paymentMethod =
          sale.payment_method === "cash"
            ? "cash"
            : sale.payment_method === "complimentary"
              ? "complimentary"
              : "card"
        acc[paymentMethod].order_count += 1
        acc[paymentMethod].gross_total += toNumber(sale.total)
        acc[paymentMethod].refunded_total += toNumber(sale.refunded_amount)
        acc[paymentMethod].net_total += toNumber(sale.net_total)
        acc[paymentMethod].units_sold += Number(sale.units_sold || 0)
        return acc
      },
      {
        card: {
          order_count: 0,
          gross_total: 0,
          refunded_total: 0,
          net_total: 0,
          units_sold: 0,
        },
        cash: {
          order_count: 0,
          gross_total: 0,
          refunded_total: 0,
          net_total: 0,
          units_sold: 0,
        },
        complimentary: {
          order_count: 0,
          gross_total: 0,
          refunded_total: 0,
          net_total: 0,
          units_sold: 0,
        },
      }
    )

    const todayProductMap = new Map<string, { title: string; units_sold: number; refunded_units: number; gross_total: number; discount_total: number }>()
    const todayVariantMap = new Map<string, { label: string; units_sold: number; refunded_units: number; gross_total: number; discount_total: number }>()
    const todayOperatorMap = new Map<string, { operator_name: string; order_count: number; gross_total: number; refunded_total: number; net_total: number }>()

    for (const sale of todaySales) {
      const operatorKey = normalizeKey(sale.operator_name) || "Unassigned"
      const operatorEntry = todayOperatorMap.get(operatorKey) || {
        operator_name: operatorKey,
        order_count: 0,
        gross_total: 0,
        refunded_total: 0,
        net_total: 0,
      }
      operatorEntry.order_count += 1
      operatorEntry.gross_total += toNumber(sale.total)
      operatorEntry.refunded_total += toNumber(sale.refunded_amount)
      operatorEntry.net_total += toNumber(sale.net_total)
      todayOperatorMap.set(operatorKey, operatorEntry)

      for (const item of sale.items || []) {
        const productKey = normalizeKey(item.title) || "Untitled item"
        const variantKey = `${productKey}::${normalizeKey(item.variant_title) || "Default variant"}`
        const productEntry = todayProductMap.get(productKey) || {
          title: productKey,
          units_sold: 0,
          refunded_units: 0,
          gross_total: 0,
          discount_total: 0,
        }
        const variantEntry = todayVariantMap.get(variantKey) || {
          label: normalizeKey(item.variant_title) || `${productKey} / Default variant`,
          units_sold: 0,
          refunded_units: 0,
          gross_total: 0,
          discount_total: 0,
        }

        productEntry.units_sold += Number(item.quantity || 0)
        productEntry.refunded_units += Number(item.refunded_quantity || 0)
        productEntry.gross_total += toNumber(item.total)
        productEntry.discount_total += toNumber(item.discount_total)

        variantEntry.units_sold += Number(item.quantity || 0)
        variantEntry.refunded_units += Number(item.refunded_quantity || 0)
        variantEntry.gross_total += toNumber(item.total)
        variantEntry.discount_total += toNumber(item.discount_total)

        todayProductMap.set(productKey, productEntry)
        todayVariantMap.set(variantKey, variantEntry)
      }
    }

    const top_products = Array.from(todayProductMap.values())
      .sort((a, b) => b.units_sold - a.units_sold || b.gross_total - a.gross_total)
      .slice(0, 8)

    const top_variants = Array.from(todayVariantMap.values())
      .sort((a, b) => b.units_sold - a.units_sold || b.gross_total - a.gross_total)
      .slice(0, 8)

    const operator_breakdown = Array.from(todayOperatorMap.values())
      .sort((a, b) => b.gross_total - a.gross_total)
      .slice(0, 8)

    return res.status(200).json({
      sales,
      summary: {
        recent_order_count: sales.length,
        ...totals,
        today,
        today_reconciliation: {
          average_order_value: today.order_count ? today.gross_total / today.order_count : 0,
          discount_total: todayDiscountTotal,
          refund_event_count: todayRefundEvents,
          product_count: top_products.length,
          by_payment_method: todayByPaymentMethod,
          top_products,
          top_variants,
          operator_breakdown,
        },
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load POS sales history.",
    })
  }
}
