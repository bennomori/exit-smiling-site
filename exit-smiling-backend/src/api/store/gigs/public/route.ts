import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { hiddenDefaultGigIds, publicGigs, readGigStore } from "../../../../lib/gig-admin"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const store = await readGigStore()

    return res.status(200).json({
      ok: true,
      gigs: publicGigs(store),
      hiddenDefaultGigIds: hiddenDefaultGigIds(store),
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load gigs.",
    })
  }
}
