import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readGigStore, writeGigStore } from "../../../../lib/gig-admin"
import { normalizeMemberSlug, verifyMemberToken } from "../../../../lib/member-media"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      id?: string
    }
    const member = normalizeMemberSlug(body.member)
    const id = String(body.id || "").trim()

    verifyMemberToken(body.token, member)

    if (!id) {
      throw new Error("Gig id is required.")
    }

    const store = await readGigStore()
    const customGigExists = (store.gigs || []).some((gig) => gig.id === id)
    const gigs = (store.gigs || []).map((gig) => (gig.id === id ? { ...gig, hidden: true } : gig))
    const hiddenDefaultGigIds = customGigExists
      ? store.hiddenDefaultGigIds || []
      : Array.from(new Set([...(store.hiddenDefaultGigIds || []), id]))

    await writeGigStore({ gigs, hiddenDefaultGigIds })

    return res.status(200).json({
      ok: true,
      gigs,
      hiddenDefaultGigIds,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to hide gig.",
    })
  }
}
