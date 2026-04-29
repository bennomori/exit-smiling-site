import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStripeClient } from "../../../../../../lib/stripe"

function normalizePaymentIntentError(paymentIntent: any) {
  if (!paymentIntent?.last_payment_error) return null

  return {
    code: paymentIntent.last_payment_error.code || null,
    message: paymentIntent.last_payment_error.message || null,
    type: paymentIntent.last_payment_error.type || null,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const stripe = getStripeClient()
    const paymentIntentId = String(req.query.payment_intent_id || "").trim()
    const readerId = String(req.query.reader_id || "").trim()

    if (!paymentIntentId) {
      return res.status(400).json({ message: "payment_intent_id is required." })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const reader =
      readerId
        ? ((await stripe.terminal.readers.retrieve(readerId)) as any)
        : null

    return res.status(200).json({
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        last_payment_error: normalizePaymentIntentError(paymentIntent),
      },
      reader: reader
        ? {
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
          }
        : null,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to fetch Terminal sale status.",
    })
  }
}
