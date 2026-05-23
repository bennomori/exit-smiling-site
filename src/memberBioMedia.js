export const memberSlugs = {
  Cadence: "cadence",
  Lando: "lando",
  Julian: "julian",
  Max: "max",
  Joey: "joey",
};

export const memberNamesBySlug = Object.fromEntries(
  Object.entries(memberSlugs).map(([name, slug]) => [slug, name])
);

function withIds(items) {
  return items.map((item) => ({
    id: item.id || `default:${item.src}`,
    type: item.type || "image",
    ...item,
  }));
}

export const defaultMemberBioMedia = {
  max: withIds([
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-live-bass.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-asleep.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-soccer-01.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-logo-shirt.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-ski.jpg", className: "object-top" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-team-lab.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-soccer-02.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-waterslide-poster.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fender-tokyo-poster.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-jamberoo-poster.jpg", className: "" },
  ]),
  joey: withIds([
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-guitar-main.jpg", className: "object-top" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-helmet.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-pilot-training.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-fender-tokyo.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-snow-grooming-poster.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-timber-sledding-poster.jpg", className: "" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-wakesurfing-poster.jpg", className: "" },
  ]),
  lando: withIds([
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-guitar-main.jpg", className: "object-top" },
    {
      src: "https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-crowd-cohen-maberly.jpg",
      className: "",
      credit: "Photo: Cohen Maberly",
    },
  ]),
  cadence: withIds([
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-main.jpg", className: "" },
    {
      src: "https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-crowd-cohen-maberly.jpg",
      className: "",
      credit: "Photo: Cohen Maberly",
    },
  ]),
  julian: withIds([
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-main.jpg", className: "object-top" },
    { src: "https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-rotation-colour.jpg", className: "object-top" },
  ]),
};

export function normalizeMemberSlug(value) {
  const raw = String(value || "").trim().toLowerCase();
  return memberSlugs[value] || raw.replace(/[^a-z0-9-]/g, "");
}

export function mergeMemberBioMedia(memberNameOrSlug, overridesByMember = {}) {
  const slug = normalizeMemberSlug(memberNameOrSlug);
  const defaults = defaultMemberBioMedia[slug] || [];
  const override = overridesByMember?.[slug] || {};
  const hiddenIds = new Set(Array.isArray(override.hiddenIds) ? override.hiddenIds : []);
  const customItems = Array.isArray(override.customItems) ? override.customItems : [];
  const allItems = [...defaults, ...customItems].filter((item) => item?.id && !hiddenIds.has(item.id));
  const order = Array.isArray(override.order) ? override.order : [];

  if (!order.length) return allItems;

  const orderIndex = new Map(order.map((id, index) => [id, index]));

  return [...allItems].sort((a, b) => {
    const aIndex = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) return aIndex - bIndex;
    return allItems.indexOf(a) - allItems.indexOf(b);
  });
}
