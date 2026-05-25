import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getAllCoverArtDesigns,
  readCoverArtStore,
  uploadAttributionOptions,
} from "../../../../lib/cover-art"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const store = await readCoverArtStore()
    return res.status(200).json({
      ok: true,
      designs: getAllCoverArtDesigns(store),
      feedback: store.feedback || {},
      attributionOptions: uploadAttributionOptions,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to load cover-art survey.",
    })
  }
}
