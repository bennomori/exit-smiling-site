import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  buildMemberMediaKey,
  getMediaTypeFromContentType,
  normalizeMemberSlug,
  putR2Object,
  verifyMemberToken,
} from "../../../../lib/member-media"

const mediaBaseUrl = "https://exit-smiling-media.bennoclark.workers.dev"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      fileName?: string
      contentType?: string
      dataBase64?: string
      orientation?: string
      cropX?: number
      cropY?: number
      size?: number
    }
    const member = normalizeMemberSlug(body.member)

    verifyMemberToken(body.token, member)

    const accountId = String(process.env.R2_ACCOUNT_ID || "").trim()
    const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim()
    const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim()
    const bucket = String(process.env.R2_BUCKET_NAME || "exit-smiling-media").trim()

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return res.status(500).json({ message: "R2 upload environment is not configured." })
    }

    const contentType = String(body.contentType || "application/octet-stream").trim()
    const fileName = String(body.fileName || "member-media").trim()
    const dataBase64 = String(body.dataBase64 || "").trim()

    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ message: "Upload must be an image file for the bio rotation." })
    }

    const maxBytes = Number(process.env.MEMBER_MEDIA_UPLOAD_MAX_BYTES || process.env.MEDIA_ADMIN_UPLOAD_MAX_BYTES || 25 * 1024 * 1024)
    const file = Buffer.from(dataBase64, "base64")

    if (!file.length) {
      return res.status(400).json({ message: "No upload file was supplied." })
    }
    if (file.length > maxBytes) {
      return res.status(413).json({
        message: `Upload is too large. Current limit is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      })
    }

    const key = buildMemberMediaKey(member, fileName)

    await putR2Object({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
      key,
      contentType,
      body: file,
    })

    const item = {
      id: `custom:${key}`,
      type: getMediaTypeFromContentType(contentType),
      key,
      src: `${mediaBaseUrl}/${key}`,
      className: "",
      orientation: body.orientation === "portrait" ? "portrait" : "landscape",
      cropX: Number.isFinite(Number(body.cropX)) ? Math.min(100, Math.max(0, Math.round(Number(body.cropX)))) : 50,
      cropY: Number.isFinite(Number(body.cropY)) ? Math.min(100, Math.max(0, Math.round(Number(body.cropY)))) : body.orientation === "portrait" ? 0 : 50,
      uploadedAt: new Date().toISOString(),
    }

    return res.status(200).json({
      ok: true,
      item,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to upload member media.",
    })
  }
}
