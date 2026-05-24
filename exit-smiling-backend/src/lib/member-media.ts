import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const allowedMembers = new Set(["cadence", "lando", "julian", "max", "joey"])
const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp"])
const videoExtensions = new Set(["mp4", "mov", "webm"])

export type MemberMediaItem = {
  id: string
  type: "image" | "video"
  src: string
  key: string
  className?: string
  orientation?: "portrait" | "landscape"
  cropX?: number
  cropY?: number
  credit?: string
  uploadedAt?: string
}

export type MemberMediaConfig = {
  hiddenIds?: string[]
  order?: string[]
  customItems?: MemberMediaItem[]
  orientationOverrides?: Record<string, "portrait" | "landscape">
  cropXOverrides?: Record<string, number>
  cropYOverrides?: Record<string, number>
  bioParagraphs?: string[]
}

export type MemberMediaStore = Record<string, MemberMediaConfig>

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url")
}

function getSigningSecret() {
  return process.env.MEMBER_MEDIA_TOKEN_SECRET || process.env.JWT_SECRET || "member-media-dev-secret"
}

export function normalizeMemberSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
}

export function assertAllowedMember(member: string) {
  if (!allowedMembers.has(member)) {
    throw new Error("Invalid band member.")
  }
}

function getDataPath() {
  if (process.env.MEMBER_MEDIA_DATA_PATH) {
    return process.env.MEMBER_MEDIA_DATA_PATH
  }

  if (process.cwd().replace(/\\/g, "/").endsWith("/.medusa/server")) {
    return path.resolve(process.cwd(), "../../member-media.json")
  }

  return path.resolve(process.cwd(), "member-media.json")
}

export async function readMemberMediaStore(): Promise<MemberMediaStore> {
  try {
    const raw = await fs.readFile(getDataPath(), "utf8")
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (error: any) {
    if (error?.code === "ENOENT") return {}
    throw error
  }
}

export async function writeMemberMediaStore(store: MemberMediaStore) {
  const filePath = getDataPath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8")
}

export function parsePasscodes() {
  const raw = String(process.env.MEMBER_MEDIA_PASSCODES || "").trim()
  const passcodes: Record<string, string> = {}

  if (!raw) return passcodes

  if (raw.startsWith("{")) {
    const parsed = JSON.parse(raw)
    Object.entries(parsed).forEach(([member, passcode]) => {
      passcodes[normalizeMemberSlug(member)] = String(passcode || "")
    })
    return passcodes
  }

  raw.split(",").forEach((part) => {
    const [member, ...rest] = part.split("=")
    const passcode = rest.join("=").trim()
    if (member && passcode) {
      passcodes[normalizeMemberSlug(member)] = passcode
    }
  })

  return passcodes
}

export function createMemberToken(member: string) {
  const payload = {
    member,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  }
  const payloadText = JSON.stringify(payload)
  const encodedPayload = base64Url(payloadText)
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload, "utf8")
    .digest("base64url")

  return `${encodedPayload}.${signature}`
}

export function verifyMemberToken(token: unknown, expectedMember?: string) {
  const value = String(token || "").trim()
  const [encodedPayload, signature] = value.split(".")

  if (!encodedPayload || !signature) {
    throw new Error("Invalid member token.")
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload, "utf8")
    .digest("base64url")

  const providedSignature = Buffer.from(signature)
  const validSignature = Buffer.from(expectedSignature)

  if (providedSignature.length !== validSignature.length || !crypto.timingSafeEqual(providedSignature, validSignature)) {
    throw new Error("Invalid member token.")
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))
  const member = normalizeMemberSlug(payload?.member)

  assertAllowedMember(member)

  if (expectedMember && member !== expectedMember) {
    throw new Error("Member token does not match this profile.")
  }
  if (!payload?.exp || Number(payload.exp) < Date.now()) {
    throw new Error("Member token has expired.")
  }

  return { member }
}

export function sanitizeMemberMediaConfig(input: any): MemberMediaConfig {
  const hiddenIds = Array.isArray(input?.hiddenIds)
    ? input.hiddenIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
    : []
  const order = Array.isArray(input?.order)
    ? input.order.map((id: unknown) => String(id || "").trim()).filter(Boolean)
    : []
  const customItems = Array.isArray(input?.customItems)
    ? input.customItems
        .map((item: any) => ({
          id: String(item?.id || "").trim(),
          type: item?.type === "video" ? "video" : "image",
          src: String(item?.src || "").trim(),
          key: String(item?.key || "").trim(),
          className: String(item?.className || "").trim(),
          orientation: item?.orientation === "portrait" ? "portrait" : "landscape",
          cropX: Number.isFinite(Number(item?.cropX)) ? Math.min(100, Math.max(0, Math.round(Number(item.cropX)))) : undefined,
          cropY: Number.isFinite(Number(item?.cropY)) ? Math.min(100, Math.max(0, Math.round(Number(item.cropY)))) : undefined,
          credit: String(item?.credit || "").trim(),
          uploadedAt: String(item?.uploadedAt || "").trim(),
        }))
        .filter((item: MemberMediaItem) => item.id && item.src && item.key)
    : []
  const orientationOverrides =
    input?.orientationOverrides && typeof input.orientationOverrides === "object"
      ? Object.fromEntries(
          Object.entries(input.orientationOverrides)
            .map(([id, orientation]) => [
              String(id || "").trim(),
              orientation === "portrait" ? "portrait" : "landscape",
            ])
            .filter(([id]) => Boolean(id))
        )
      : {}
  const cropXOverrides =
    input?.cropXOverrides && typeof input.cropXOverrides === "object"
      ? Object.fromEntries(
          Object.entries(input.cropXOverrides)
            .map(([id, cropX]) => [
              String(id || "").trim(),
              Math.min(100, Math.max(0, Math.round(Number(cropX)))),
            ])
            .filter(([id, cropX]) => Boolean(id) && Number.isFinite(Number(cropX)))
        )
      : {}
  const cropYOverrides =
    input?.cropYOverrides && typeof input.cropYOverrides === "object"
      ? Object.fromEntries(
          Object.entries(input.cropYOverrides)
            .map(([id, cropY]) => [
              String(id || "").trim(),
              Math.min(100, Math.max(0, Math.round(Number(cropY)))),
            ])
            .filter(([id, cropY]) => Boolean(id) && Number.isFinite(Number(cropY)))
        )
      : {}
  const bioParagraphs = Array.isArray(input?.bioParagraphs)
    ? input.bioParagraphs
        .map((paragraph: unknown) => String(paragraph || "").trim())
        .filter(Boolean)
        .slice(0, 12)
    : []

  return { hiddenIds, order, customItems, orientationOverrides, cropXOverrides, cropYOverrides, bioParagraphs }
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

export async function putR2Object(params: {
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
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n")
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, hashHex(canonicalRequest)].join("\n")
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

export function buildMemberMediaKey(member: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "bin"
  const safeExtension = [...imageExtensions, ...videoExtensions].includes(extension) ? extension : "bin"
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "member-media"

  return `bio/${member}/member-uploads/${Date.now()}-${baseName}.${safeExtension}`
}

export function getMediaTypeFromContentType(contentType: string): "image" | "video" {
  if (contentType.startsWith("video/")) return "video"
  return "image"
}
