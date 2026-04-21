export async function getProducts() {
  const baseUrl = import.meta.env.VITE_MEDUSA_URL;
  const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

  const params = new URLSearchParams({
    fields: "*variants.calculated_price,+variants.prices,+metadata,+thumbnail,+images",
    country_code: "au",
  });

  const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, {
    headers: {
      "x-publishable-api-key": publishableKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch products: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.products || [];
}