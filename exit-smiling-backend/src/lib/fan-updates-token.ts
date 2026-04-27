import crypto from "node:crypto"

const DEFAULT_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30

function getSigningSecret() {
  return process.env.JWT_SECRET || "supersecret"
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function createSignature(payload: string) {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url")
}

export function issueFanUpdatesToken(input: {
  email: string
  subscriberId: string
  source?: string
  ttlMs?: number
}) {
  const payload = {
    sub: input.subscriberId,
    email: input.email,
    source: input.source || "studio_sessions",
    exp: Date.now() + (input.ttlMs || DEFAULT_TOKEN_TTL_MS),
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createSignature(encodedPayload)

  return {
    token: `${encodedPayload}.${signature}`,
    expires_at: payload.exp,
  }
}

export function verifyFanUpdatesToken(token: string) {
  const [encodedPayload, signature] = String(token || "").split(".")

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = createSignature(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null
  }

  const signatureIsValid = crypto.timingSafeEqual(
    signatureBuffer,
    expectedSignatureBuffer
  )

  if (!signatureIsValid) {
    return null
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload))

  if (!payload?.sub || !payload?.email || !payload?.exp) {
    return null
  }

  if (Date.now() > payload.exp) {
    return null
  }

  return payload as {
    sub: string
    email: string
    source: string
    exp: number
  }
}
