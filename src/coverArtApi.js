import { prepareImageForUpload, readFileAsBase64 } from "./memberMediaApi";

const baseUrl = import.meta.env.VITE_MEDUSA_URL || "";
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

const commonHeaders = {
  "x-publishable-api-key": publishableKey,
  "Content-Type": "application/json",
};

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export async function getCoverArtSurvey() {
  const response = await fetch(`${baseUrl}/store/cover-art/public`, {
    method: "GET",
    headers: commonHeaders,
    cache: "no-store",
  });

  return parseResponse(response, "Failed to load cover-art survey.");
}

export async function uploadCoverArtDesign({ token, member, file, title, uploadedBy }) {
  const prepared = await prepareImageForUpload(file);
  const dataBase64 = await readFileAsBase64(prepared.file);

  let response;

  try {
    response = await fetch(`${baseUrl}/store/cover-art/upload`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        token,
        member,
        title,
        uploadedBy,
        fileName: prepared.file.name,
        contentType: prepared.file.type || "image/jpeg",
        size: prepared.file.size,
        dataBase64,
      }),
    });
  } catch (error) {
    throw new Error("Upload could not reach the backend. Try refreshing the page, then upload a smaller image.");
  }

  return parseResponse(response, "Failed to upload cover-art design.");
}

export async function updateCoverArtDesign({ token, member, designId, title, uploadedBy }) {
  const response = await fetch(`${baseUrl}/store/cover-art/update`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      token,
      member,
      designId,
      title,
      uploadedBy,
    }),
  });

  return parseResponse(response, "Failed to update cover-art design.");
}

export async function saveCoverArtVote({ token, member, designId, score, comment, deleteCommentIndex }) {
  const response = await fetch(`${baseUrl}/store/cover-art/vote`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      token,
      member,
      designId,
      score,
      comment,
      deleteCommentIndex,
    }),
  });

  return parseResponse(response, "Failed to save cover-art vote.");
}
