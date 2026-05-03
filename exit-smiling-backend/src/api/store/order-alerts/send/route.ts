import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendOrderAlert } from "../../../../lib/order-alerts"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      order_id?: string
      source?: string
      force?: boolean
    }
    const orderId = String(body.order_id || "").trim()

    if (!orderId) {
      return res.status(400).json({
        message: "order_id is required.",
      })
    }

    const result = await sendOrderAlert(req.scope, orderId, {
      source: String(body.source || "Manual test").trim(),
      force: body.force !== false,
    })

    return res.status(200).json({
      ok: true,
      result,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to send order alert.",
    })
  }
}
