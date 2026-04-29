const baseUrl = import.meta.env.VITE_MEDUSA_URL || "";
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

const commonHeaders = {
  "x-publishable-api-key": publishableKey,
  "Content-Type": "application/json",
};

async function readJson(res, fallbackMessage) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || fallbackMessage);
  }

  return res.json();
}

export async function ensurePosLocation() {
  const res = await fetch(`${baseUrl}/store/pos/terminal/locations`, {
    method: "POST",
    headers: commonHeaders,
  });

  return readJson(res, "Failed to prepare POS Terminal location.");
}

export async function listTerminalReaders({ locationId, simulated } = {}) {
  const params = new URLSearchParams();

  if (locationId) {
    params.set("location_id", locationId);
  }

  if (simulated === true) {
    params.set("simulated", "true");
  }

  const query = params.toString();
  const res = await fetch(
    `${baseUrl}/store/pos/terminal/readers${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: commonHeaders,
    }
  );

  return readJson(res, "Failed to load Terminal readers.");
}

export async function ensureSimulatedReader({ locationId, label } = {}) {
  const res = await fetch(`${baseUrl}/store/pos/terminal/simulated-reader`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      location_id: locationId,
      label,
    }),
  });

  return readJson(res, "Failed to prepare simulated reader.");
}

export async function startTerminalSale(payload) {
  const res = await fetch(`${baseUrl}/store/pos/terminal/sales`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify(payload),
  });

  return readJson(res, "Failed to start Terminal sale.");
}

export async function getTerminalSaleStatus({ paymentIntentId, readerId }) {
  const params = new URLSearchParams({
    payment_intent_id: paymentIntentId,
  });

  if (readerId) {
    params.set("reader_id", readerId);
  }

  const res = await fetch(`${baseUrl}/store/pos/terminal/sales/status?${params.toString()}`, {
    method: "GET",
    headers: commonHeaders,
  });

  return readJson(res, "Failed to fetch Terminal sale status.");
}
