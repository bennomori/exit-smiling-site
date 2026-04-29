import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStripeClient } from "../../../../../lib/stripe"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as { location_id?: string }
    const locationId = String(body.location_id || "").trim()

    const stripe = getStripeClient()
    const connectionToken = await stripe.terminal.connectionTokens.create(
      locationId ? { location: locationId } : {}
    )

    return res.status(200).json({
      secret: connectionToken.secret,
      location: connectionToken.location || null,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to create Terminal connection token.",
    })
  }
}
