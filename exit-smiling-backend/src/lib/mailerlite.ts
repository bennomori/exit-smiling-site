const MAILERLITE_API_BASE_URL = "https://connect.mailerlite.com/api"
const DEFAULT_MAILERLITE_GROUP_NAME = "Exit Smiling Fan List"

type MailerLiteGroup = {
  id: string
  name: string
}

type SyncSubscriberInput = {
  email: string
  source: string
}

function getMailerLiteToken() {
  return String(process.env.MAILERLITE_API_TOKEN || "").trim()
}

function getMailerLiteGroupId() {
  return String(process.env.MAILERLITE_GROUP_ID || "").trim()
}

function getMailerLiteGroupName() {
  return String(process.env.MAILERLITE_GROUP_NAME || DEFAULT_MAILERLITE_GROUP_NAME).trim()
}

function isMailerLiteEnabled() {
  return Boolean(getMailerLiteToken())
}

async function mailerLiteFetch(path: string, options: RequestInit = {}) {
  const token = getMailerLiteToken()

  const response = await fetch(`${MAILERLITE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      `MailerLite request failed with status ${response.status}`

    throw new Error(message)
  }

  return body
}

async function listGroupsByName(name: string): Promise<MailerLiteGroup[]> {
  const data = await mailerLiteFetch(
    `/groups?filter[name]=${encodeURIComponent(name)}&limit=100`
  )

  return Array.isArray(data?.data) ? data.data : []
}

async function createGroup(name: string): Promise<MailerLiteGroup> {
  const data = await mailerLiteFetch("/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  })

  return data?.data
}

async function resolveGroupId() {
  const configuredGroupId = getMailerLiteGroupId()
  if (configuredGroupId) return configuredGroupId

  const groupName = getMailerLiteGroupName()
  const groups = await listGroupsByName(groupName)
  const exactMatch = groups.find(
    (group) => String(group.name || "").trim().toLowerCase() === groupName.toLowerCase()
  )

  if (exactMatch?.id) return exactMatch.id

  const createdGroup = await createGroup(groupName)
  return createdGroup?.id ? String(createdGroup.id) : ""
}

export async function syncSubscriberToMailerLite(input: SyncSubscriberInput) {
  if (!isMailerLiteEnabled()) {
    return {
      enabled: false,
      synced: false,
    }
  }

  const groupId = await resolveGroupId()
  const groups = groupId ? [groupId] : []

  const data = await mailerLiteFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      groups,
      status: "active",
    }),
  })

  return {
    enabled: true,
    synced: true,
    group_id: groupId || null,
    subscriber_id: data?.data?.id || null,
    status: data?.data?.status || null,
  }
}
