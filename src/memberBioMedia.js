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

export const defaultMemberBioParagraphs = {
  cadence: [
    "Cadence is a young vocalist known for her powerful tone, wide range, and natural ability to adapt across a broad spectrum of musical styles. Her voice carries strength and emotion with dynamic versatility, leaving a lasting impact on her listeners.",
    "Cadence draws strong inspiration from iconic vocal artists such as Amy Lee of Evanescence and Emily Armstrong of Linkin Park, with these influences shaping her connection to a wide range of rock styles. However, her love of country, pop, and indie music follows closely behind, fuelling a musical journey that remains unconfined to any one genre, allowing her evolving skill to continually grow.",
    "Born and raised on the South Coast, Cadence's passion for singing and music began at a young age, naturally guiding her into the creative young artist she is quickly becoming. At the age of 13 she joined the band that later became Exit Smiling, marking the beginning of her experience as a live performer and lead vocalist.",
    "Although still early in her formal training, Cadence began receiving professional vocal coaching in August 2025 from a renowned opera singer based in the UK. A blend of modern with classical training continues to refine her natural ability, further develop her technique, and support her growth as an emerging musician.",
  ],
  joey: [
    "Joey is a 14-year-old lead guitarist bringing raw energy and a rapidly evolving sound to modern rock.",
    "Born in Niseko, Japan, Joey picked up his first right-handed acoustic guitar at just seven years old. After relocating to Australia in 2018, he made the switch to left-handed electric guitar, a transition that helped shape his distinctive playing style and musical identity.",
    "Drawing influence from a wide range of alternative, nu-metal, and hard rock artists, Joey's playing blends tight, driving rhythm work with expressive lead lines. His approach is instinctive and feel-driven, always pushing beyond his years as he continues to develop both technically and creatively.",
    "As lead guitarist, Joey plays a key role in shaping the band's sound, balancing melody, aggression, and tone across both live performances and original music.",
    "He is the proud caretaker of a growing guitar lineup, including a Fender Telecaster, Fender Stratocaster, and a Gibson SG, each contributing to his expanding tonal range. His guitar quiver reflects his music mentors: Tom Morello (RATM), Jimi Hendrix (The Hendrix Experience), and Tony Iommi (Black Sabbath).",
    "Still early in his journey, Joey is focused on writing, performing, and carving out his place in the next generation of rock musicians.",
  ],
  max: [
    "Max is the Exit Smiling bassist and has loved it since it all began in Julian's office, struggling through a 12-bar blues. Now he brings a funky, solid element to the band, both musically and socially, getting lost in jams with Julian, writing with the band, and heading out to switch off and have fun when he can (not too much fun).",
    "Max also enjoys mountain biking, skiing, hunting, and soccer, which he fuels with a lot of music, from shredding a pow day blasting Rage Against the Machine (not too loud, his parents don't want him to damage his ears) to listening to Hilltop Hoods to focus before a game.",
    "Max has a very wide taste in music, with bands like Rage Against the Machine, Linkin Park, Black Sabbath, The Beatles, Audioslave, Hilltop Hoods, and Powderfinger forming the backbone of his influence. However, local influences such as the legendary Dave Berry and The Spindrift Saga have been just as important. He takes lessons from Dave Berry in practical elements, from setting up an overdrive pedal to understanding the genius of an AC/DC song, while members of The Spindrift Saga have taught him the cold, hard theory required to tackle a range of musical challenges, no matter how repetitive it may seem. These local legends give him and the band real insight into the music industry and how bands operate within it.",
    "Max is from the South Coast and brings a regional approach to problems, with a laid-back, fun-loving energy that is a core part of the band and a big reason why he and the others have formed such a strong bond.",
  ],
  julian: [
    "Julian is 14 years old and was born in Manchester, UK, the heart of music in 90s England, where big bands like Oasis, The Smiths, and The Stone Roses came from. Julian moved to Australia when he was just 1 and started drumming at the age of 5. The first gig he watched was Henge in England in 2017. He also learned to play the piano through COVID and continues to grow his musical skill set beyond just rhythm.",
    "Julian's main drumming influence comes from drummers such as Brad Wilks (RATM), Ringo Starr (The Beatles), and John Otto (Limp Bizkit). This influence brings a wide range of styles, such as hip hop, funk, and nu metal, into his drumming.",
    "Julian started writing and creating music with his younger brother during lockdown at age 10 and released a couple of music videos, which can still be tracked down on YouTube if you search hard enough. These videos gained enough attention to make it to the front page of the local paper, feature in The Canberra Times, and the boys were interviewed, with their songs played on ABC Radio.",
    "Julian has also competed and won the local St Cecilia Music Scholarships and competed with the top 20 drummers in Years 7-9 in NSW in the final of the OSIC drum competition. He has been taking lessons from one of Australia's best jazz drummers, a former ANU drum teacher, using this to blend classical technique with more modern rock styles.",
    "Julian's ambition would be to one day get sponsored by Heinz and Adidas, and he would like to receive unlimited free products from both companies.",
  ],
  lando: [
    "Sharing the role of vocals, Lando brings high energy with a good dose of swagger to the stage.",
    "An eclectic mix of musical styles from his early years has helped him develop a powerful and vibrant vocal tone, punching out rhymes in style.",
    "Complementing his powerhouse vocals, Lando also delivers rhythm and artistic flair through backing guitar.",
    "Drawing influence and inspiration from legendary bands such as Nirvana, Rage Against the Machine, and Linkin Park, Lando aspires to bring raw and honest energy to the stage.",
  ],
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
  const orientationOverrides =
    override.orientationOverrides && typeof override.orientationOverrides === "object"
      ? override.orientationOverrides
      : {};
  const cropYOverrides =
    override.cropYOverrides && typeof override.cropYOverrides === "object"
      ? override.cropYOverrides
      : {};
  const cropXOverrides =
    override.cropXOverrides && typeof override.cropXOverrides === "object"
      ? override.cropXOverrides
      : {};
  const allItems = [...defaults, ...customItems]
    .filter((item) => item?.id && !hiddenIds.has(item.id))
    .map((item) => ({
      ...item,
      ...(orientationOverrides[item.id]
        ? { orientation: orientationOverrides[item.id] === "portrait" ? "portrait" : "landscape" }
        : {}),
      ...(Number.isFinite(Number(cropYOverrides[item.id]))
        ? { cropY: Math.min(100, Math.max(0, Number(cropYOverrides[item.id]))) }
        : {}),
      ...(Number.isFinite(Number(cropXOverrides[item.id]))
        ? { cropX: Math.min(100, Math.max(0, Number(cropXOverrides[item.id]))) }
        : {}),
    }));
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

export function getMemberBioParagraphs(memberNameOrSlug, overridesByMember = {}) {
  const slug = normalizeMemberSlug(memberNameOrSlug);
  const override = overridesByMember?.[slug] || {};
  const paragraphs = Array.isArray(override.bioParagraphs)
    ? override.bioParagraphs.map((paragraph) => String(paragraph || "").trim()).filter(Boolean)
    : [];

  return paragraphs.length ? paragraphs : defaultMemberBioParagraphs[slug] || [];
}
