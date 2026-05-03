import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderAlert } from "../lib/order-alerts"

export default async function orderAlertHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id?: string }>) {
  const orderId = String(data?.id || "").trim()

  if (!orderId) {
    return
  }

  try {
    await sendOrderAlert(container, orderId, { source: "Website" })
  } catch (error) {
    console.error("Failed to send website order alert", error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
