import fs from "node:fs/promises"
import path from "node:path"
import {
  normalizeMemberSlug,
  putR2Object,
  verifyMemberToken,
} from "./member-media"

const mediaBaseUrl = "https://exit-smiling-media.bennoclark.workers.dev"

export const coverArtMembers = {
  cadence: "Cadence",
  lando: "Lando",
  julian: "Julian",
  max: "Max",
  joey: "Joey",
} as const

export const uploadAttributionOptions = [
  ...Object.values(coverArtMembers),
  "Band",
  "Parent / helper",
  "Other",
]

export type CoverArtDesign = {
  id: string
  title: string
  src: string
  key: string
  uploadedBy: string
  uploadedByMember?: string
  uploadedAt: string
  source: "starter" | "upload"
}

export type CoverArtFeedback = {
  score: number
  comment: string
  comments?: Array<{
    text: string
    createdAt: string
  }>
  updatedAt: string
}

export type CoverArtStore = {
  designs?: CoverArtDesign[]
  designOverrides?: Record<string, Partial<Pick<CoverArtDesign, "title" | "uploadedBy">> & { updatedAt?: string }>
  feedback?: Record<string, Record<string, CoverArtFeedback>>
}

export const defaultCoverArtDesigns: CoverArtDesign[] = [
  {
    id: "starter:exit-smiling-cover-rounded",
    title: "Rounded Debut Cover",
    src: `${mediaBaseUrl}/cover-art/debut-single/exit-smiling-cover-rounded.png`,
    key: "cover-art/debut-single/exit-smiling-cover-rounded.png",
    uploadedBy: "Joey",
    uploadedByMember: "joey",
    uploadedAt: "2026-05-25T00:00:00.000Z",
    source: "starter",
  },
  {
    id: "starter:es-wrinkled-logo-quality",
    title: "Wrinkled Logo Cover",
    src: `${mediaBaseUrl}/cover-art/debut-single/es-wrinkled-logo-quality.png`,
    key: "cover-art/debut-single/es-wrinkled-logo-quality.png",
    uploadedBy: "Joey",
    uploadedByMember: "joey",
    uploadedAt: "2026-05-25T00:00:00.000Z",
    source: "starter",
  },
]

function getDataPath() {
  if (process.env.COVER_ART_DATA_PATH) {
    return process.env.COVER_ART_DATA_PATH
  }

  if (process.cwd().replace(/\\/g, "/").endsWith("/.medusa/server")) {
    return path.resolve(process.cwd(), "../../cover-art.json")
  }

  return path.resolve(process.cwd(), "cover-art.json")
}

export async function readCoverArtStore(): Promise<CoverArtStore> {
  try {
    const raw = await fs.readFile(getDataPath(), "utf8")
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch (error: any) {
    if (error?.code === "ENOENT") return {}
    throw error
  }
}

export async function writeCoverArtStore(store: CoverArtStore) {
  const filePath = getDataPath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8")
}

export function getAllCoverArtDesigns(store: CoverArtStore) {
  const customDesigns = Array.isArray(store.designs) ? store.designs : []
  const overrides = store.designOverrides && typeof store.designOverrides === "object" ? store.designOverrides : {}

  return [...defaultCoverArtDesigns, ...customDesigns].map((design) => {
    const override = overrides[design.id] || {}
    return {
      ...design,
      ...(override.title ? { title: override.title } : {}),
      ...(override.uploadedBy ? { uploadedBy: override.uploadedBy } : {}),
    }
  })
}

export function sanitizeAttribution(value: unknown, fallback: string) {
  const raw = String(value || "").trim()
  if (!raw) return fallback
  return raw.slice(0, 80)
}

export function sanitizeScore(value: unknown) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.min(5, Math.max(0, Math.round(score)))
}

export function verifyCoverArtToken(token: unknown, memberValue: unknown) {
  const member = normalizeMemberSlug(memberValue)
  verifyMemberToken(token, member)
  return member
}

export function buildCoverArtKey(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg"
  const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg"
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cover-art"

  return `cover-art/debut-single/member-uploads/${Date.now()}-${baseName}.${safeExtension}`
}

export async function uploadCoverArtObject(params: {
  fileName: string
  contentType: string
  body: Buffer
}) {
  const accountId = String(process.env.R2_ACCOUNT_ID || "").trim()
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID || "").trim()
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY || "").trim()
  const bucket = String(process.env.R2_BUCKET_NAME || "exit-smiling-media").trim()

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 upload environment is not configured.")
  }

  const key = buildCoverArtKey(params.fileName)
  await putR2Object({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key,
    contentType: params.contentType,
    body: params.body,
  })

  return { key, src: `${mediaBaseUrl}/${key}` }
}
