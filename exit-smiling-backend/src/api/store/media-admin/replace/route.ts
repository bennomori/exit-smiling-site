import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"])
const videoExtensions = new Set(["mp4", "mov"])

function getExtension(key: string) {
  return key.split(".").pop()?.toLowerCase() || ""
}

function getExpectedType(key: string) {
  const extension = getExtension(key)
  if (imageExtensions.has(extension)) return "image"
  if (videoExtensions.has(extension)) return "video"
  return "file"
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest()
}

function hashHex(value: Buffer | string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function encodeR2Key(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`))
    .join("/")
}

async function putR2Object(params: {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  contentType: string
  body: Buffer
}) {
  const endpointHost = `${params.accountId}.r2.cloudflarestorage.com`
  const encodedKey = encodeR2Key(params.key)
  const canonicalUri = `/${params.bucket}/${encodedKey}`
  const url = `https://${endpointHost}${canonicalUri}`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)
  const region = "auto"
  const service = "s3"
  const scope = `${dateStamp}/${region}/${service}/aws4_request`
  const payloadHash = hashHex(params.body)

  const canonicalHeaders = [
    `host:${endpointHost}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n"
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    hashHex(canonicalRequest),
  ].join("\n")

  const dateKey = hmac(`AWS4${params.secretAccessKey}`, dateStamp)
  const dateRegionKey = hmac(dateKey, region)
  const dateRegionServiceKey = hmac(dateRegionKey, service)
  const signingKey = hmac(dateRegionServiceKey, "aws4_request")
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex")
  const authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": params.contentType,
      "Content-Length": String(params.body.length),
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: params.body as any,
  })

  if (!response.ok) {
    const details = await response.text().catch(() => "")
    throw new Error(`R2 upload failed: ${response.status} ${details}`.trim())
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      key?: string
      contentType?: string
      dataBase64?: string
      size?: number
    }
    const expectedToken = String(process.env.MEDIA_ADMIN_UPLOAD_TOKEN || "").trim()
    const providedToken = String(body.token || "").trim()

    if (!expectedToken || providedToken !== expectedToken) {
      return res.status(401).json({ message: "Unauthorized media replacement request." })
    }

    const accountId = String(process.env.R2_ACCOUNT_ID || "").trim()
    const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim()
    const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim()
    const bucket = String(process.env.R2_BUCKET_NAME || "exit-smiling-media").trim()

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return res.status(500).json({ message: "R2 upload environment is not configured." })
    }

    const key = String(body.key || "").trim()
    const contentType = String(body.contentType || "application/octet-stream").trim()
    const dataBase64 = String(body.dataBase64 || "").trim()

    if (!key || key.includes("..") || key.startsWith("/") || key.endsWith("/")) {
      return res.status(400).json({ message: "Invalid R2 key." })
    }

    const expectedType = getExpectedType(key)
    if (expectedType === "image" && !contentType.startsWith("image/")) {
      return res.status(400).json({ message: "Replacement must be an image for this slot." })
    }
    if (expectedType === "video" && !contentType.startsWith("video/")) {
      return res.status(400).json({ message: "Replacement must be a video for this slot." })
    }

    const maxBytes = Number(process.env.MEDIA_ADMIN_UPLOAD_MAX_BYTES || 25 * 1024 * 1024)
    const file = Buffer.from(dataBase64, "base64")

    if (!file.length) {
      return res.status(400).json({ message: "No replacement file was supplied." })
    }
    if (file.length > maxBytes) {
      return res.status(413).json({
        message: `Replacement is too large. Current limit is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      })
    }

    await putR2Object({
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
      key,
      contentType,
      body: file,
    })

    return res.status(200).json({
      ok: true,
      key,
      bytes: file.length,
      contentType,
      replacedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to replace media asset.",
    })
  }
}
