export const sizeGuides = {
  mens: {
    title: "Mens T-Shirts & Hoodies",
    description: "Use chest measurement to choose the best size.",
    columns: ["Size", "Chest"],
    rows: [
      ["XXS", "84 cm"],
      ["XS", "89 cm"],
      ["S", "94 cm"],
      ["M", "99 cm"],
      ["L", "105 cm"],
      ["XL", "111 cm"],
      ["2XL", "117 cm"],
      ["3XL", "123 cm"],
      ["4XL", "129 cm"],
    ],
    howToMeasure:
      "Measure around the fullest part of the chest, keeping the tape measure level under the arms.",
  },
  womens: {
    title: "Womens T-Shirts & Hoodies",
    description: "Use bust, waist and hip measurements to choose the best size.",
    columns: ["AU Size", "Bust", "Waist", "Hip"],
    rows: [
      ["6", "80 cm", "61 cm", "86 cm"],
      ["8", "85 cm", "66 cm", "91 cm"],
      ["10", "90 cm", "71 cm", "96 cm"],
      ["12", "95 cm", "76 cm", "101 cm"],
      ["14", "100 cm", "81 cm", "106 cm"],
      ["16", "105 cm", "86 cm", "111 cm"],
      ["18", "110 cm", "91 cm", "116 cm"],
      ["20", "115 cm", "96 cm", "121 cm"],
      ["22", "120 cm", "101 cm", "126 cm"],
      ["24", "125 cm", "116 cm", "131 cm"],
      ["26", "130 cm", "121 cm", "136 cm"],
    ],
    howToMeasure:
      "Measure around the fullest part of the bust, the narrowest part of the waist, and the fullest part of the hips.",
  },
  kids: {
    title: "Kids T-Shirts & Hoodies",
    description: "Start with height, then check chest and waist measurements.",
    columns: ["Size", "Height", "Chest", "Waist", "Weight"],
    rows: [
      ["1", "84 cm", "", "", "12 kg"],
      ["2", "92 cm", "56 cm", "54 cm", ""],
      ["3", "100 cm", "58 cm", "55 cm", ""],
      ["4", "108 cm", "60 cm", "56 cm", ""],
      ["5", "115 cm", "62 cm", "57 cm", ""],
      ["6", "120 cm", "64 cm", "58 cm", ""],
      ["7", "125 cm", "66 cm", "59 cm", ""],
      ["8", "130 cm", "68 cm", "60 cm", ""],
      ["9", "135 cm", "71 cm", "61 cm", ""],
    ],
    howToMeasure:
      "For kids, height is usually the easiest starting point. Then check chest and waist measurements for the best fit.",
  },
}

export function detectSizeGuideType(product, selectedOptions = {}) {
  const typeValue = String(selectedOptions?.type || selectedOptions?.Type || "").trim().toLowerCase()
  const title = String(product?.title || "").trim().toLowerCase()
  const haystack = `${typeValue} ${title}`

  if (haystack.includes("women")) return "womens"
  if (haystack.includes("kid")) return "kids"
  if (haystack.includes("men")) return "mens"

  return null
}
