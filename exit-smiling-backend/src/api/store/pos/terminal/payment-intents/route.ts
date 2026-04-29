import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStripeClient } from "../../../../../lib/stripe"

type PosSaleItem = {
  product_id?: string
  variant_id?: string
  title?: string
  variant_title?: string
  quantity?: number
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      amount?: number
      currency?: string
      description?: string
      metadata?: Record<string, string | number | boolean | null | undefined>
      items?: PosSaleItem[]
      receipt_email?: string
    }

    const amount = Number(body.amount)
    const currency = String(body.currency || "aud")
      .trim()
      .toLowerCase()
    const description = String(body.description || "Exit Smiling merch stand sale").trim()
    const receiptEmail = String(body.receipt_email || "").trim().toLowerCase()
    const items = Array.isArray(body.items) ? body.items : []

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: "A positive integer amount is required." })
    }

    const metadata: Record<string, string> = {}
    const sourceMetadata = body.metadata || {}

    for (const [key, value] of Object.entries(sourceMetadata)) {
      if (value == null) continue
      metadata[key] = String(value)
    }

    metadata.pos_mode = "ipad_terminal"
    metadata.sale_item_count = String(items.length)
    metadata.sale_items = JSON.stringify(
      items.map((item) => ({
        product_id: item.product_id || "",
        variant_id: item.variant_id || "",
        title: item.title || "",
        variant_title: item.variant_title || "",
        quantity: Number(item.quantity || 0),
      }))
    ).slice(0, 500)

    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      capture_method: "automatic",
      payment_method_types: ["card_present"],
      metadata,
      receipt_email: receiptEmail || undefined,
    })

    return res.status(200).json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to create Terminal payment intent.",
    })
  }
}
