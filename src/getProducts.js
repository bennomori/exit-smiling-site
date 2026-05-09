import { productOrder } from "./productOrder";

const productOrderLookup = new Map(
  productOrder.map((value, index) => [String(value).trim().toLowerCase(), index + 1])
);

function getProductSortRank(product) {
  const metadata = product?.metadata || {};
  const metadataRank = Number(
    metadata.sort_order ?? metadata.display_order ?? metadata.merch_order ?? metadata.rank
  );

  if (Number.isFinite(metadataRank)) {
    return metadataRank;
  }

  const handleRank = productOrderLookup.get(String(product?.handle || "").trim().toLowerCase());
  if (handleRank != null) {
    return handleRank;
  }

  const titleRank = productOrderLookup.get(String(product?.title || "").trim().toLowerCase());
  if (titleRank != null) {
    return titleRank;
  }

  return Number.MAX_SAFE_INTEGER;
}

function sortProductsForMerch(products) {
  return [...products].sort((a, b) => {
    const salesDifference = Number(b.units_sold || 0) - Number(a.units_sold || 0);
    if (salesDifference !== 0) return salesDifference;

    const rankDifference = getProductSortRank(a) - getProductSortRank(b);
    if (rankDifference !== 0) return rankDifference;

    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function normalizeProductTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function getProductSalesRank(baseUrl, publishableKey) {
  const emptyRank = {
    productUnitsSold: {},
    variantUnitsSold: {},
    titleUnitsSold: {},
  };

  if (!publishableKey) {
    return emptyRank;
  }

  try {
    const res = await fetch(`${baseUrl}/store/product-sales-rank`, {
      headers: {
        "x-publishable-api-key": publishableKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return emptyRank;
    }

    const data = await res.json();
    return {
      productUnitsSold: data.product_units_sold || {},
      variantUnitsSold: data.variant_units_sold || {},
      titleUnitsSold: data.product_title_units_sold || {},
    };
  } catch {
    return emptyRank;
  }
}

export async function getProducts() {
  const baseUrl = import.meta.env.VITE_MEDUSA_URL || "";
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
  const salesRank = await getProductSalesRank(baseUrl, publishableKey);
  const productUnitsSold = salesRank.productUnitsSold || {};
  const variantUnitsSold = salesRank.variantUnitsSold || {};
  const titleUnitsSold = salesRank.titleUnitsSold || {};

  const normalizeMediaUrl = (url) => {
    const value = String(url || "").trim();

    if (!value) return value;

    return value.replace(/^https?:\/\/localhost:9000\/static\//i, `${baseUrl}/static/`);
  };

  const products = (data.products || []).map((product) => ({
    ...product,
    units_sold: Math.max(
      Number(productUnitsSold[product.id] || 0),
      (product.variants || []).reduce(
        (total, variant) => total + Number(variantUnitsSold[variant.id] || 0),
        0
      ),
      Number(titleUnitsSold[normalizeProductTitle(product.title)] || 0)
    ),
    thumbnail: normalizeMediaUrl(product.thumbnail),
    images: (product.images || []).map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url),
    })),
  }));

  const sortedProducts = sortProductsForMerch(products);

  if (import.meta.env.DEV) {
    console.table(
      sortedProducts.map((product) => ({
        product: product.title,
        units_sold: product.units_sold,
      }))
    );
  }

  return sortedProducts;
}
