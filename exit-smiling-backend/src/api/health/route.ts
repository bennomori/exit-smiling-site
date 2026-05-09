import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const startedAt = Date.now()

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    await query.graph({
      entity: "product",
      fields: ["id"],
      pagination: {
        take: 1,
      },
    })

    res.status(200).json({
      ok: true,
      service: "exit-smiling-medusa",
      database: "ok",
      uptime_seconds: Math.round(process.uptime()),
      response_time_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "exit-smiling-medusa",
      database: "error",
      message: error instanceof Error ? error.message : "Health check failed.",
      response_time_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    })
  }
}
