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

export async function getPublicMemberMedia() {
  const response = await fetch(`${baseUrl}/store/member-media/public`, {
    method: "GET",
    headers: commonHeaders,
    cache: "no-store",
  });

  return parseResponse(response, "Failed to load member media.");
}

export async function loginMemberMedia({ member, passcode }) {
  const response = await fetch(`${baseUrl}/store/member-media/login`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ member, passcode }),
  });

  return parseResponse(response, "Failed to log in.");
}

export async function saveMemberMedia({ token, member, media }) {
  const response = await fetch(`${baseUrl}/store/member-media/save`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ token, member, media }),
  });

  return parseResponse(response, "Failed to save member media.");
}

export async function uploadMemberMedia({ token, member, file, dataBase64 }) {
  const response = await fetch(`${baseUrl}/store/member-media/upload`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      token,
      member,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      dataBase64,
    }),
  });

  return parseResponse(response, "Failed to upload member media.");
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
