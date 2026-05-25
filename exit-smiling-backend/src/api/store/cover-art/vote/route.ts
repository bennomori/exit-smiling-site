import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getAllCoverArtDesigns,
  readCoverArtStore,
  sanitizeScore,
  verifyCoverArtToken,
  writeCoverArtStore,
} from "../../../../lib/cover-art"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      designId?: string
      score?: number
      comment?: string
    }
    const member = verifyCoverArtToken(body.token, body.member)
    const designId = String(body.designId || "").trim()
    const store = await readCoverArtStore()
    const designs = getAllCoverArtDesigns(store)

    if (!designs.some((design) => design.id === designId)) {
      return res.status(404).json({ message: "Cover design not found." })
    }

    const existingFeedback = store.feedback?.[designId]?.[member]
    const previousComments = Array.isArray(existingFeedback?.comments)
      ? existingFeedback.comments
      : existingFeedback?.comment
        ? [{ text: String(existingFeedback.comment), createdAt: existingFeedback.updatedAt || new Date().toISOString() }]
        : []
    const nextComment = String(body.comment || "").trim().slice(0, 1200)
    const feedback = {
      score: sanitizeScore(body.score),
      comment: nextComment || String(existingFeedback?.comment || ""),
      comments: nextComment
        ? [...previousComments, { text: nextComment, createdAt: new Date().toISOString() }]
        : previousComments,
      updatedAt: new Date().toISOString(),
    }

    store.feedback = store.feedback || {}
    store.feedback[designId] = {
      ...(store.feedback[designId] || {}),
      [member]: feedback,
    }

    await writeCoverArtStore(store)

    return res.status(200).json({
      ok: true,
      feedback: store.feedback,
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error?.message || "Failed to save cover-art vote.",
    })
  }
}
