import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  POS_LOCATION_METADATA_KEY,
  POS_LOCATION_METADATA_VALUE,
  getOrCreatePosLocation,
  getStripeClient,
} from "../../../../../lib/stripe"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const stripe = getStripeClient()
    const locations = await stripe.terminal.locations.list({ limit: 100 })

    return res.status(200).json({
      locations: locations.data.map((location) => ({
        id: location.id,
        display_name: location.display_name,
        metadata: location.metadata || {},
        is_pos_default:
          location.metadata?.[POS_LOCATION_METADATA_KEY] === POS_LOCATION_METADATA_VALUE,
      })),
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to list Terminal locations.",
    })
  }
}

export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const location = await getOrCreatePosLocation()

    return res.status(200).json({
      location: {
        id: location.id,
        display_name: location.display_name,
        metadata: location.metadata || {},
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to prepare POS Terminal location.",
    })
  }
}
