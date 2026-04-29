import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStripeClient } from "../../../../../lib/stripe"

function normalizeReaderLocation(location: any) {
  if (!location) return null

  if (typeof location === "string") {
    return {
      id: location,
      display_name: location,
    }
  }

  return {
    id: location.id,
    display_name: location.display_name || location.id,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const stripe = getStripeClient()
    const locationId = String(req.query.location_id || "").trim()
    const simulatedOnly = String(req.query.simulated || "").trim().toLowerCase() === "true"

    const readers = await stripe.terminal.readers.list({
      limit: 100,
      ...(locationId ? { location: locationId } : {}),
    })

    const filteredReaders = readers.data.filter((reader) => {
      if (!simulatedOnly) return true
      return String(reader.device_type || "").startsWith("simulated_")
    })

    return res.status(200).json({
      readers: filteredReaders.map((reader) => ({
        id: reader.id,
        label: reader.label,
        serial_number: reader.serial_number,
        device_type: reader.device_type,
        status: reader.status,
        livemode: reader.livemode,
        location: normalizeReaderLocation(reader.location),
        action: reader.action
          ? {
              type: reader.action.type,
              status: reader.action.status,
              failure_code: reader.action.failure_code,
              failure_message: reader.action.failure_message,
            }
          : null,
      })),
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to list Terminal readers.",
    })
  }
}
