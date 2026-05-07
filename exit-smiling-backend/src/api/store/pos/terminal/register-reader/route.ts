import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOrCreatePosLocation, getStripeClient } from "../../../../../lib/stripe"

function serializeReader(reader: any, location: any) {
  return {
    id: reader.id,
    label: reader.label,
    serial_number: reader.serial_number,
    device_type: reader.device_type,
    status: reader.status,
    livemode: reader.livemode,
    location: {
      id: location.id,
      display_name: location.display_name,
    },
    action: reader.action
      ? {
          type: reader.action.type,
          status: reader.action.status,
          failure_code: reader.action.failure_code,
          failure_message: reader.action.failure_message,
        }
      : null,
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      registration_code?: string
      location_id?: string
      label?: string
    }

    const registrationCode = String(body.registration_code || "").trim().toLowerCase()

    if (!registrationCode) {
      return res.status(400).json({
        message: "A Stripe Terminal registration code is required.",
      })
    }

    const stripe = getStripeClient()
    const requestedLocationId = String(body.location_id || "").trim()
    const location =
      requestedLocationId
        ? ((await stripe.terminal.locations.retrieve(requestedLocationId)) as any)
        : await getOrCreatePosLocation()

    const reader = await stripe.terminal.readers.create({
      location: location.id,
      registration_code: registrationCode,
      label: String(body.label || "Exit Smiling S710"),
      metadata: {
        pos_mode: "ipad_terminal",
        registered_from: "exit_smiling_pos",
      },
    })

    return res.status(200).json({
      reader: serializeReader(reader, location),
      location: {
        id: location.id,
        display_name: location.display_name,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to register Terminal reader.",
    })
  }
}
