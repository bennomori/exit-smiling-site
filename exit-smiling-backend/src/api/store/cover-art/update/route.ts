import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getAllCoverArtDesigns,
  readCoverArtStore,
  sanitizeAttribution,
  verifyCoverArtToken,
  writeCoverArtStore,
} from "../../../../lib/cover-art"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      designId?: string
      title?: string
      uploadedBy?: string
    }
    verifyCoverArtToken(body.token, body.member)

    const designId = String(body.designId || "").trim()
    const store = await readCoverArtStore()
    const designs = getAllCoverArtDesigns(store)

    if (!designs.some((design) => design.id === designId)) {
      return res.status(404).json({ message: "Cover design not found." })
    }

    const title = String(body.title || "").trim().slice(0, 80)
    if (!title) {
      return res.status(400).json({ message: "Artwork title is required." })
    }

    store.designOverrides = store.designOverrides || {}
    store.designOverrides[designId] = {
      ...(store.designOverrides[designId] || {}),
      title,
      uploadedBy: sanitizeAttribution(body.uploadedBy, "Band"),
      updatedAt: new Date().toISOString(),
    }

    await writeCoverArtStore(store)

    return res.status(200).json({
      ok: true,
      designs: getAllCoverArtDesigns(store),
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to update cover-art design.",
    })
  }
}
