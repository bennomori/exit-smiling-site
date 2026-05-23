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

export async function getPublicGigs() {
  const response = await fetch(`${baseUrl}/store/gigs/public`, {
    method: "GET",
    headers: commonHeaders,
    cache: "no-store",
  });

  return parseResponse(response, "Failed to load gigs.");
}

export async function saveGig({ token, member, gig }) {
  const response = await fetch(`${baseUrl}/store/gigs/save`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ token, member, gig }),
  });

  return parseResponse(response, "Failed to save gig.");
}

export async function hideGig({ token, member, id }) {
  const response = await fetch(`${baseUrl}/store/gigs/hide`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({ token, member, id }),
  });

  return parseResponse(response, "Failed to remove gig.");
}

export function dateLabelFromIso(dateIso) {
  const date = new Date(`${dateIso}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return date
    .toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      timeZone: "Australia/Sydney",
    })
    .toUpperCase();
}
