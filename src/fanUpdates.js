const baseUrl = import.meta.env.VITE_MEDUSA_URL || ""
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY

const commonHeaders = {
  "x-publishable-api-key": publishableKey,
  "Content-Type": "application/json",
}

export async function registerFanUpdatesAccess({ email, consentChecked, source = "studio_sessions" }) {
  const res = await fetch(`${baseUrl}/store/fan-updates/register`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      email,
      consent_checked: consentChecked,
      source,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.message || "Failed to register fan updates access.")
  }

  return data
}

export async function verifyFanUpdatesAccess(token) {
  const res = await fetch(
    `${baseUrl}/store/fan-updates/verify?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: commonHeaders,
      cache: "no-store",
    }
  )

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.message || "Failed to verify fan updates access.")
  }

  return data
}
