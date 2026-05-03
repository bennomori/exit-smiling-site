import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const postmarkToken = String(process.env.POSTMARK_SERVER_TOKEN || "").trim()
    const fromEmail = String(process.env.ORDER_ALERT_FROM_EMAIL || "").trim()
    const recipients = String(process.env.ORDER_ALERT_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)

    if (!postmarkToken || !fromEmail || !recipients.length) {
      return res.status(400).json({
        message:
          "POSTMARK_SERVER_TOKEN, ORDER_ALERT_FROM_EMAIL, and ORDER_ALERT_EMAILS must be configured.",
      })
    }

    await Promise.all(
      recipients.map(async (recipient) => {
        const response = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            "X-Postmark-Server-Token": postmarkToken,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            From: fromEmail,
            To: recipient,
            Subject: "Exit Smiling order alert test",
            TextBody:
              "This is a test of the Exit Smiling Medusa order alert email setup.",
            HtmlBody:
              "<p>This is a test of the Exit Smiling Medusa order alert email setup.</p>",
            MessageStream: "outbound",
          }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }
      })
    )

    return res.status(200).json({
      ok: true,
      from: fromEmail,
      recipients,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to send Postmark test email.",
    })
  }
}
