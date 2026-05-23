import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readMemberMediaStore } from "../../../../lib/member-media"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const media = await readMemberMediaStore()

    return res.status(200).json({
      ok: true,
      media,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load member media.",
    })
  }
}
