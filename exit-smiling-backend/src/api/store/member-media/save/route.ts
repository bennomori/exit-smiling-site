import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  normalizeMemberSlug,
  readMemberMediaStore,
  sanitizeMemberMediaConfig,
  verifyMemberToken,
  writeMemberMediaStore,
} from "../../../../lib/member-media"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      media?: unknown
    }
    const member = normalizeMemberSlug(body.member)

    verifyMemberToken(body.token, member)

    const store = await readMemberMediaStore()
    store[member] = sanitizeMemberMediaConfig(body.media)

    await writeMemberMediaStore(store)

    return res.status(200).json({
      ok: true,
      media: store,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to save member media.",
    })
  }
}
