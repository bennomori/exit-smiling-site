import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAN_SUBSCRIBERS_MODULE } from "../../../../modules/fan-subscribers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fanSubscribersService = req.scope.resolve(FAN_SUBSCRIBERS_MODULE)
  const email = String(req.query.email || "").trim().toLowerCase()

  const subscribers = await fanSubscribersService.listFanSubscribers(
    email ? { email_normalized: email } : {},
    {
      order: {
        created_at: "DESC",
      },
      take: 200,
    }
  )

  res.status(200).json({
    count: subscribers.length,
    subscribers,
  })
}
