import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAN_SUBSCRIBERS_MODULE } from "../../../../modules/fan-subscribers"
import { issueFanUpdatesToken } from "../../../../lib/fan-updates-token"

const CONSENT_TEXT_VERSION = "fan-updates-v1"

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as {
    email?: string
    consent_checked?: boolean
    source?: string
  }

  const email = normalizeEmail(body.email || "")
  const consentChecked = body.consent_checked === true
  const source = String(body.source || "studio_sessions")

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "A valid email address is required." })
  }

  if (!consentChecked) {
    return res.status(400).json({ message: "Consent is required." })
  }

  const fanSubscribersService = req.scope.resolve(FAN_SUBSCRIBERS_MODULE)

  const existingSubscribers = await fanSubscribersService.listFanSubscribers(
    { email_normalized: email },
    { take: 1 }
  )

  const now = new Date()

  const subscriber =
    existingSubscribers[0]
      ? await fanSubscribersService.updateFanSubscribers({
          id: existingSubscribers[0].id,
          email,
          email_normalized: email,
          consent_given: true,
          consent_text_version: CONSENT_TEXT_VERSION,
          source,
          status: "active",
          consent_at: now,
          last_unlocked_at: now,
        })
      : await fanSubscribersService.createFanSubscribers({
          email,
          email_normalized: email,
          consent_given: true,
          consent_text_version: CONSENT_TEXT_VERSION,
          source,
          status: "active",
          consent_at: now,
          last_unlocked_at: now,
        })

  const token = issueFanUpdatesToken({
    email,
    subscriberId: subscriber.id,
    source,
  })

  return res.status(200).json({
    authorized: true,
    email,
    token: token.token,
    expires_at: token.expires_at,
  })
}
