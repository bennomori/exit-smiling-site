import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readGigStore, sanitizeGigEntry, writeGigStore } from "../../../../lib/gig-admin"
import { normalizeMemberSlug, verifyMemberToken } from "../../../../lib/member-media"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      gig?: unknown
    }
    const member = normalizeMemberSlug(body.member)

    verifyMemberToken(body.token, member)

    const store = await readGigStore()
    const nextGig = sanitizeGigEntry(body.gig, member)
    const gigs = store.gigs || []
    const existingIndex = gigs.findIndex((gig) => gig.id === nextGig.id)

    if (existingIndex >= 0) {
      gigs[existingIndex] = nextGig
    } else {
      gigs.push(nextGig)
    }

    await writeGigStore({ gigs })

    return res.status(200).json({
      ok: true,
      gigs,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to save gig.",
    })
  }
}
