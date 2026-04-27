import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAN_SUBSCRIBERS_MODULE } from "../../../../modules/fan-subscribers"
import { verifyFanUpdatesToken } from "../../../../lib/fan-updates-token"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = String(req.query.token || "")
  const payload = verifyFanUpdatesToken(token)

  if (!payload) {
    return res.status(401).json({ authorized: false, message: "Invalid or expired token." })
  }

  const fanSubscribersService = req.scope.resolve(FAN_SUBSCRIBERS_MODULE)
  const subscribers = await fanSubscribersService.listFanSubscribers(
    {
      id: payload.sub,
      email_normalized: String(payload.email).trim().toLowerCase(),
      status: "active",
    },
    { take: 1 }
  )

  const subscriber = subscribers[0]

  if (!subscriber) {
    return res.status(401).json({ authorized: false, message: "Subscriber not found." })
  }

  await fanSubscribersService.updateFanSubscribers({
    id: subscriber.id,
    last_unlocked_at: new Date(),
  })

  return res.status(200).json({
    authorized: true,
    email: subscriber.email_normalized,
    expires_at: payload.exp,
  })
}
