import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  assertAllowedMember,
  createMemberToken,
  normalizeMemberSlug,
  parsePasscodes,
} from "../../../../lib/member-media"

const memberNames: Record<string, string> = {
  cadence: "Cadence",
  lando: "Lando",
  julian: "Julian",
  max: "Max",
  joey: "Joey",
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      member?: string
      passcode?: string
    }
    const member = normalizeMemberSlug(body.member)
    const passcode = String(body.passcode || "").trim()

    assertAllowedMember(member)

    const passcodes = parsePasscodes()
    const expectedPasscode = String(passcodes[member] || "").trim()

    if (!expectedPasscode) {
      return res.status(500).json({
        message: "Member media passcodes are not configured on the backend.",
      })
    }

    if (!passcode || !safeEqual(passcode, expectedPasscode)) {
      return res.status(401).json({
        message: "Incorrect passcode.",
      })
    }

    return res.status(200).json({
      ok: true,
      member,
      memberName: memberNames[member] || member,
      token: createMemberToken(member),
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to log in.",
    })
  }
}
