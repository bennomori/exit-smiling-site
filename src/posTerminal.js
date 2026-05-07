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

export async function registerTerminalReader({ registrationCode, locationId, label } = {}) {
  const res = await fetch(`${baseUrl}/store/pos/terminal/register-reader`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      registration_code: registrationCode,
      location_id: locationId,
      label,
    }),
  });

  return readJson(res, "Failed to register Terminal reader.");
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

export async function finalizePosSale({ paymentIntentId, items }) {
  const res = await fetch(`${baseUrl}/store/pos/finalize-sale`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      payment_intent_id: paymentIntentId,
      items,
    }),
  })

  return readJson(res, "Failed to finalize POS inventory sync.")
}

export async function createCashPosSale({
  items,
  receiptEmail,
  customerMobile,
  operatorName,
  eventName,
  cashReceived,
  note,
  delivery,
}) {
  const res = await fetch(`${baseUrl}/store/pos/cash-sale`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      items,
      receipt_email: receiptEmail || undefined,
      customer_mobile: customerMobile || undefined,
      operator_name: operatorName || undefined,
      event_name: eventName || undefined,
      cash_received: cashReceived,
      note: note || undefined,
      delivery,
    }),
  })

  return readJson(res, "Failed to record cash POS sale.")
}

export async function createComplimentaryPosSale({
  items,
  receiptEmail,
  customerMobile,
  operatorName,
  eventName,
  note,
  delivery,
}) {
  const res = await fetch(`${baseUrl}/store/pos/complimentary-sale`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      items,
      receipt_email: receiptEmail || undefined,
      customer_mobile: customerMobile || undefined,
      operator_name: operatorName || undefined,
      event_name: eventName || undefined,
      note: note || undefined,
      delivery,
    }),
  })

  return readJson(res, "Failed to record complimentary POS sale.")
}

export async function refundPosSale({
  orderId,
  paymentIntentId,
  amount,
  note,
  restock = true,
  items,
  requestKey,
}) {
  const res = await fetch(`${baseUrl}/store/pos/refund-sale`, {
    method: "POST",
    headers: commonHeaders,
    body: JSON.stringify({
      order_id: orderId || undefined,
      payment_intent_id: paymentIntentId || undefined,
      amount: amount ?? undefined,
      note: note || undefined,
      restock,
      items: Array.isArray(items) && items.length ? items : undefined,
      request_key: requestKey || undefined,
    }),
  })

  return readJson(res, "Failed to refund POS sale.")
}

export async function getPosSales({ limit } = {}) {
  const params = new URLSearchParams()

  if (limit) {
    params.set("limit", String(limit))
  }

  const res = await fetch(
    `${baseUrl}/store/pos/sales${params.toString() ? `?${params.toString()}` : ""}`,
    {
      method: "GET",
      headers: commonHeaders,
    }
  )

  return readJson(res, "Failed to load POS sales.")
}
