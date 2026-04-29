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
      reader_id?: string
    }

    const amount = Number(body.amount)
    const readerId = String(body.reader_id || "").trim()
    const currency = String(body.currency || "aud")
      .trim()
      .toLowerCase()
    const description = String(body.description || "Exit Smiling merch stand sale").trim()
    const receiptEmail = String(body.receipt_email || "").trim().toLowerCase()
    const items = Array.isArray(body.items) ? body.items : []

    if (!readerId) {
      return res.status(400).json({ message: "A reader_id is required." })
    }

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

    const reader = await stripe.terminal.readers.processPaymentIntent(readerId, {
      payment_intent: paymentIntent.id,
      process_config: {
        skip_tipping: true,
        enable_customer_cancellation: true,
      },
    })

    const isSimulatedReader = String(reader.device_type || "").startsWith("simulated_")

    if (isSimulatedReader) {
      await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId, {
        type: "card_present",
        card_present: {
          number: "4242424242424242",
        },
      })
    }

    return res.status(200).json({
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      reader: {
        id: reader.id,
        label: reader.label,
        status: reader.status,
        action: reader.action
          ? {
              type: reader.action.type,
              status: reader.action.status,
              failure_code: reader.action.failure_code,
              failure_message: reader.action.failure_message,
            }
          : null,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to start Terminal sale.",
    })
  }
}
