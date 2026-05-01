import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addShippingMethodToCartWorkflow } from "@medusajs/core-flows"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      cart_id?: string
      option_ids?: string[]
    }

    const cartId = String(body.cart_id || "").trim()
    const optionIds = Array.from(
      new Set(
        (Array.isArray(body.option_ids) ? body.option_ids : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    )

    if (!cartId) {
      return res.status(400).json({ message: "A cart_id is required." })
    }

    if (!optionIds.length) {
      return res.status(400).json({ message: "At least one option_id is required." })
    }

    await addShippingMethodToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        options: optionIds.map((id) => ({ id })),
      },
    })

    return res.status(200).json({
      ok: true,
      cart_id: cartId,
      option_ids: optionIds,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to replace cart shipping methods.",
    })
  }
}
