import fs from "node:fs/promises"
import path from "node:path"

export type GigEntry = {
  id: string
  dateIso: string
  date: string
  city: string
  venue: string
  time: string
  note: string
  href?: string
  mapHref?: string
  ctaLabel?: string
  posterImage?: string
  disabledActions?: boolean
  hidden?: boolean
  createdBy?: string
  createdAt?: string
}

export type GigStore = {
  gigs?: GigEntry[]
  hiddenDefaultGigIds?: string[]
}

function getDataPath() {
  if (process.env.GIG_ADMIN_DATA_PATH) {
    return process.env.GIG_ADMIN_DATA_PATH
  }

  if (process.cwd().replace(/\\/g, "/").endsWith("/.medusa/server")) {
    return path.resolve(process.cwd(), "../../gig-admin.json")
  }

  return path.resolve(process.cwd(), "gig-admin.json")
}

export async function readGigStore(): Promise<GigStore> {
  try {
    const raw = await fs.readFile(getDataPath(), "utf8")
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : { gigs: [], hiddenDefaultGigIds: [] }
  } catch (error: any) {
    if (error?.code === "ENOENT") return { gigs: [], hiddenDefaultGigIds: [] }
    throw error
  }
}

export async function writeGigStore(store: GigStore) {
  const filePath = getDataPath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        gigs: store.gigs || [],
        hiddenDefaultGigIds: store.hiddenDefaultGigIds || [],
      },
      null,
      2,
    ),
    "utf8",
  )
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength)
}

function cleanUrl(value: unknown) {
  const url = cleanText(value, 900)
  if (!url) return ""
  return /^https?:\/\//i.test(url) ? url : ""
}

function dateLabelFromIso(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`)

  if (Number.isNaN(date.getTime())) return ""

  return date
    .toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      timeZone: "Australia/Sydney",
    })
    .toUpperCase()
}

export function sanitizeGigEntry(input: any, createdBy: string): GigEntry {
  const dateIso = cleanText(input?.dateIso, 10)
  const date = cleanText(input?.date, 20) || dateLabelFromIso(dateIso)
  const city = cleanText(input?.city, 120)
  const venue = cleanText(input?.venue, 180)
  const time = cleanText(input?.time, 80) || "Time TBD"
  const note = cleanText(input?.note, 220) || "Live show"
  const href = cleanUrl(input?.href)
  const mapHref = cleanUrl(input?.mapHref)
  const posterImage = cleanUrl(input?.posterImage)
  const ctaLabel = cleanText(input?.ctaLabel, 40)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    throw new Error("Gig date is required.")
  }
  if (!city) {
    throw new Error("Gig city is required.")
  }
  if (!venue) {
    throw new Error("Gig venue is required.")
  }

  return {
    id: cleanText(input?.id, 80) || `gig:${Date.now()}`,
    dateIso,
    date,
    city,
    venue,
    time,
    note,
    href,
    mapHref,
    posterImage,
    ctaLabel,
    disabledActions: Boolean(input?.disabledActions),
    hidden: Boolean(input?.hidden),
    createdBy,
    createdAt: cleanText(input?.createdAt, 40) || new Date().toISOString(),
  }
}

export function publicGigs(store: GigStore) {
  return (store.gigs || [])
    .filter((gig) => !gig.hidden)
    .sort((a, b) => String(a.dateIso).localeCompare(String(b.dateIso)))
}

export function hiddenDefaultGigIds(store: GigStore) {
  return Array.isArray(store.hiddenDefaultGigIds)
    ? store.hiddenDefaultGigIds.map((id) => String(id || "").trim()).filter(Boolean)
    : []
}
