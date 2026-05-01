export async function getProducts() {
  const baseUrl = import.meta.env.VITE_MEDUSA_URL;
  const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

  const params = new URLSearchParams({
    fields:
      "*variants.calculated_price,+variants.prices,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+variants.stocked_quantity,+variants.available_quantity,+metadata,+thumbnail,+images,+shipping_profile_id,+shipping_profile",
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

  const normalizeMediaUrl = (url) => {
    const value = String(url || "").trim();

    if (!value) return value;

    return value.replace(/^https?:\/\/localhost:9000\/static\//i, "/static/");
  };

  return (data.products || []).map((product) => ({
    ...product,
    thumbnail: normalizeMediaUrl(product.thumbnail),
    images: (product.images || []).map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url),
    })),
  }));
}
