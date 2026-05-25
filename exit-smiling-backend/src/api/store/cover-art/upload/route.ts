import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  coverArtMembers,
  readCoverArtStore,
  sanitizeAttribution,
  uploadCoverArtObject,
  verifyCoverArtToken,
  writeCoverArtStore,
} from "../../../../lib/cover-art"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      fileName?: string
      contentType?: string
      dataBase64?: string
      title?: string
      uploadedBy?: string
    }
    const member = verifyCoverArtToken(body.token, body.member)
    const memberName = coverArtMembers[member as keyof typeof coverArtMembers] || member
    const contentType = String(body.contentType || "application/octet-stream").trim()
    const dataBase64 = String(body.dataBase64 || "").trim()

    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ message: "Upload must be an image file." })
    }

    const file = Buffer.from(dataBase64, "base64")
    const maxBytes = Number(process.env.COVER_ART_UPLOAD_MAX_BYTES || process.env.MEDIA_ADMIN_UPLOAD_MAX_BYTES || 25 * 1024 * 1024)

    if (!file.length) {
      return res.status(400).json({ message: "No upload file was supplied." })
    }
    if (file.length > maxBytes) {
      return res.status(413).json({
        message: `Upload is too large. Current limit is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      })
    }

    const uploaded = await uploadCoverArtObject({
      fileName: String(body.fileName || "cover-art.jpg"),
      contentType,
      body: file,
    })
    const uploadedAt = new Date().toISOString()
    const design = {
      id: `upload:${uploaded.key}`,
      title: String(body.title || "").trim().slice(0, 80) || "Untitled cover concept",
      src: uploaded.src,
      key: uploaded.key,
      uploadedBy: sanitizeAttribution(body.uploadedBy, memberName),
      uploadedByMember: member,
      uploadedAt,
      source: "upload" as const,
    }

    const store = await readCoverArtStore()
    store.designs = [...(Array.isArray(store.designs) ? store.designs : []), design]
    store.feedback = store.feedback || {}
    await writeCoverArtStore(store)

    return res.status(200).json({
      ok: true,
      design,
      designs: store.designs,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to upload cover art.",
    })
  }
}
