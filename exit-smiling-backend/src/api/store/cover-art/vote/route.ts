import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  coverArtMembers,
  getAllCoverArtDesigns,
  readCoverArtStore,
  sanitizeScore,
  verifyCoverArtToken,
  writeCoverArtStore,
} from "../../../../lib/cover-art"

function normalizeComments(comments: any, fallbackComment?: any, fallbackUpdatedAt?: any) {
  if (Array.isArray(comments) && comments.length) {
    return comments
      .map((comment) => {
        if (typeof comment === "string") {
          return {
            text: comment.trim(),
            createdAt: fallbackUpdatedAt || new Date().toISOString(),
            agreedBy: [],
          }
        }

        return {
          text: String(comment?.text || "").trim(),
          createdAt: comment?.createdAt || fallbackUpdatedAt || new Date().toISOString(),
          agreedBy: Array.isArray(comment?.agreedBy) ? comment.agreedBy : [],
        }
      })
      .filter((comment) => comment.text)
  }

  const fallbackText = String(fallbackComment || "").trim()
  return fallbackText
    ? [{ text: fallbackText, createdAt: fallbackUpdatedAt || new Date().toISOString(), agreedBy: [] }]
    : []
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      token?: string
      member?: string
      designId?: string
      score?: number
      comment?: string
      deleteCommentIndex?: number
      agreeCommentMember?: string
      agreeCommentIndex?: number
    }
    const member = verifyCoverArtToken(body.token, body.member)
    const designId = String(body.designId || "").trim()
    const store = await readCoverArtStore()
    const designs = getAllCoverArtDesigns(store)

    if (!designs.some((design) => design.id === designId)) {
      return res.status(404).json({ message: "Cover design not found." })
    }

    const agreeCommentMember = String(body.agreeCommentMember || "").trim()
    if (agreeCommentMember) {
      if (!(agreeCommentMember in coverArtMembers)) {
        return res.status(400).json({ message: "Comment member was not recognised." })
      }
      if (agreeCommentMember === member) {
        return res.status(400).json({ message: "You cannot agree with your own comment." })
      }

      const targetFeedback = store.feedback?.[designId]?.[agreeCommentMember]
      const targetComments = normalizeComments(
        targetFeedback?.comments,
        targetFeedback?.comment,
        targetFeedback?.updatedAt
      )
      const agreeCommentIndex = Number(body.agreeCommentIndex)

      if (!Number.isInteger(agreeCommentIndex) || !targetComments[agreeCommentIndex]) {
        return res.status(404).json({ message: "Comment not found." })
      }

      const currentAgreedBy = Array.isArray(targetComments[agreeCommentIndex].agreedBy)
        ? targetComments[agreeCommentIndex].agreedBy
        : []
      const alreadyAgreed = currentAgreedBy.includes(member)
      const nextAgreedBy = alreadyAgreed
        ? currentAgreedBy.filter((item) => item !== member)
        : [...currentAgreedBy, member]
      const nextComments = targetComments.map((comment, index) => (
        index === agreeCommentIndex
          ? { ...comment, agreedBy: nextAgreedBy }
          : comment
      ))
      const latestComment = nextComments.length ? String(nextComments[nextComments.length - 1]?.text || "") : ""

      store.feedback = store.feedback || {}
      store.feedback[designId] = {
        ...(store.feedback[designId] || {}),
        [agreeCommentMember]: {
          score: sanitizeScore(targetFeedback?.score),
          comment: latestComment,
          comments: nextComments,
          updatedAt: new Date().toISOString(),
        },
      }

      await writeCoverArtStore(store)

      return res.status(200).json({
        ok: true,
        feedback: store.feedback,
      })
    }

    const existingFeedback = store.feedback?.[designId]?.[member]
    const previousComments = normalizeComments(
      existingFeedback?.comments,
      existingFeedback?.comment,
      existingFeedback?.updatedAt
    )
    const nextComment = String(body.comment || "").trim().slice(0, 1200)
    const deleteCommentIndex = Number(body.deleteCommentIndex)
    const keptComments = Number.isInteger(deleteCommentIndex)
      ? previousComments.filter((_comment, index) => index !== deleteCommentIndex)
      : previousComments
    const nextComments = nextComment
      ? [...keptComments, { text: nextComment, createdAt: new Date().toISOString() }]
      : keptComments
    const latestComment = nextComments.length ? String(nextComments[nextComments.length - 1]?.text || "") : ""
    const feedback = {
      score: sanitizeScore(body.score),
      comment: latestComment,
      comments: nextComments,
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
