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
        operator_name: order.metadata?.operator_name || "",
        event_name: order.metadata?.event_name || "",
        payment_intent_id: order.metadata?.stripe_payment_intent_id || "",
        reader_id: order.metadata?.pos_reader_id || "",
        label: getSaleLabel(order),
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          variant_title: item.variant_title || item.metadata?.variant_title || "",
          quantity: Number(item?.detail?.quantity || item?.quantity || 0),
          subtotal: toNumber(item?.subtotal),
          discount_total: toNumber(item?.discount_total),
          total: toNumber(item?.total),
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

    return res.status(200).json({
      sales,
      summary: {
        recent_order_count: sales.length,
        ...totals,
        today,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load POS sales history.",
    })
  }
}
