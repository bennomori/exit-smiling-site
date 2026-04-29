import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOrCreatePosLocation, getStripeClient } from "../../../../../lib/stripe"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      location_id?: string
      label?: string
    }

    const stripe = getStripeClient()
    const requestedLocationId = String(body.location_id || "").trim()
    const location =
      requestedLocationId
        ? ((await stripe.terminal.locations.retrieve(requestedLocationId)) as any)
        : await getOrCreatePosLocation()

    const existingReaders = await stripe.terminal.readers.list({
      location: location.id,
      limit: 100,
    })

    const existingSimulatedReader = existingReaders.data.find((reader) =>
      String(reader.device_type || "").startsWith("simulated_")
    )

    if (existingSimulatedReader) {
      return res.status(200).json({
        reader: {
          id: existingSimulatedReader.id,
          label: existingSimulatedReader.label,
          serial_number: existingSimulatedReader.serial_number,
          device_type: existingSimulatedReader.device_type,
          status: existingSimulatedReader.status,
          location: {
            id: location.id,
            display_name: location.display_name,
          },
        },
        created: false,
      })
    }

    const reader = await stripe.terminal.readers.create({
      location: location.id,
      registration_code: "simulated-wpe",
      label: String(body.label || "Simulated WisePOS E"),
      metadata: {
        pos_mode: "ipad_terminal",
      },
    })

    return res.status(200).json({
      reader: {
        id: reader.id,
        label: reader.label,
        serial_number: reader.serial_number,
        device_type: reader.device_type,
        status: reader.status,
        location: {
          id: location.id,
          display_name: location.display_name,
        },
      },
      created: true,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to prepare simulated Terminal reader.",
    })
  }
}
