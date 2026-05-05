import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAN_SUBSCRIBERS_MODULE } from "../../../../../modules/fan-subscribers"

function escapeCsvCell(value: unknown) {
  const text = value == null ? "" : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function formatDate(value: unknown) {
  if (!value) return ""

  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fanSubscribersService = req.scope.resolve(FAN_SUBSCRIBERS_MODULE)
  const email = String(req.query.email || "").trim().toLowerCase()
  const source = String(req.query.source || "").trim()
  const status = String(req.query.status || "").trim()

  const filters: Record<string, string> = {}

  if (email) filters.email_normalized = email
  if (source) filters.source = source
  if (status) filters.status = status

  const subscribers = await fanSubscribersService.listFanSubscribers(filters, {
    order: {
      created_at: "DESC",
    },
    take: 5000,
  })

  const headers = [
    "email",
    "source",
    "status",
    "consent_given",
    "consent_text_version",
    "consent_at",
    "last_unlocked_at",
    "created_at",
    "updated_at",
    "id",
  ]

  const rows = subscribers.map((subscriber) =>
    [
      subscriber.email,
      subscriber.source,
      subscriber.status,
      subscriber.consent_given ? "true" : "false",
      subscriber.consent_text_version,
      formatDate(subscriber.consent_at),
      formatDate(subscriber.last_unlocked_at),
      formatDate(subscriber.created_at),
      formatDate(subscriber.updated_at),
      subscriber.id,
    ].map(escapeCsvCell).join(",")
  )

  const csv = [headers.join(","), ...rows].join("\r\n")
  const timestamp = new Date().toISOString().slice(0, 10)

  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="exit-smiling-fan-subscribers-${timestamp}.csv"`
  )

  return res.status(200).send(csv)
}
