import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { AddressElement, Elements } from "@stripe/react-stripe-js";
import { getProducts } from "./getProducts";
import {
  createComplimentaryPosSale,
  createCashPosSale,
  ensurePosLocation,
  ensureSimulatedReader,
  finalizePosSale,
  getPosSales,
  getTerminalSaleStatus,
  listTerminalReaders,
  registerTerminalReader,
  refundPosSale,
  startTerminalSale,
} from "./posTerminal";
import { detectSizeGuideType, sizeGuides } from "./sizeGuides";

const posLocationId = String(import.meta.env.VITE_STRIPE_TERMINAL_LOCATION_ID || "").trim();
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const addressStripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const brandLogo =
  "https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-yellow-transparent.png";
const smileyLogo =
  "https://exit-smiling-media.bennoclark.workers.dev/pos/pos-smiley-mark-transparent.png";
const receiptLogo =
  "https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-black-transparent.png";
const receiptQrCode =
  "https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=https%3A%2F%2Fwww.exitsmiling.com.au";
const heroImages = [
  "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-01.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-03.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-04.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-02.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-06.jpg",
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount || 0);
}

function normalizeOptionKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeOptionValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getVariantOptionMap(variant) {
  const map = {};

  (variant?.options || []).forEach((opt) => {
    const optionName = normalizeOptionKey(opt.option?.title || opt.option?.name);
    if (!optionName) return;
    map[optionName] = normalizeOptionValue(opt.value);
  });

  return map;
}

function findMatchingVariant(product, selectedOptions) {
  if (!product?.variants?.length) return null;

  const normalizedSelectedOptions = Object.fromEntries(
    Object.entries(selectedOptions || {}).map(([key, value]) => [
      normalizeOptionKey(key),
      normalizeOptionValue(value),
    ])
  );

  const requiredOptionNames = (product?.options || [])
    .map((option) => normalizeOptionKey(option.title || option.name))
    .filter(Boolean);

  const hasCompleteSelection =
    requiredOptionNames.length === 0 ||
    requiredOptionNames.every((optionName) => normalizedSelectedOptions[optionName]);

  if (!hasCompleteSelection) return null;

  return (
    product.variants.find((variant) => {
      const variantOptionMap = getVariantOptionMap(variant);
      return Object.entries(normalizedSelectedOptions).every(
        ([optionName, optionValue]) => variantOptionMap[optionName] === optionValue
      );
    }) || null
  );
}

function getVariantPrice(variant) {
  const amount =
    variant?.calculated_price?.calculated_amount ??
    variant?.calculated_price?.original_amount ??
    0;

  return Number(amount);
}

function getVariantInventoryQuantity(variant) {
  const value = [
    variant?.inventory_quantity,
    variant?.available_quantity,
    variant?.stocked_quantity,
  ].find((entry) => entry != null && !Number.isNaN(Number(entry)));

  return value == null ? null : Number(value);
}

function getVariantStockMeta(variant) {
  if (!variant) {
    return {
      label: "",
      tone: "muted",
      low: false,
      out: false,
      madeToOrder: false,
    };
  }

  if (!variant.manage_inventory) {
    return {
      label: "Stock not tracked",
      tone: "muted",
      low: false,
      out: false,
      madeToOrder: false,
    };
  }

  const quantity = getVariantInventoryQuantity(variant);

  if (quantity == null) {
    return variant.allow_backorder
      ? {
          label: "Made to order",
          tone: "warning",
          low: false,
          out: false,
          madeToOrder: true,
        }
      : {
          label: "Stock unavailable",
          tone: "danger",
          low: false,
          out: true,
          madeToOrder: false,
        };
  }

  if (quantity <= 0) {
    return variant.allow_backorder
      ? {
          label: "Made to order",
          tone: "warning",
          low: false,
          out: false,
          madeToOrder: true,
        }
      : {
          label: "Out of stock",
          tone: "danger",
          low: false,
          out: true,
          madeToOrder: false,
        };
  }

  if (quantity === 1) {
    return {
      label: "Last one",
      tone: "warning",
      low: true,
      out: false,
      madeToOrder: false,
    };
  }

  if (quantity <= 3) {
    return {
      label: `Low stock: ${quantity}`,
      tone: "warning",
      low: true,
      out: false,
      madeToOrder: false,
    };
  }

  return {
    label: `${quantity} in stock`,
    tone: "ok",
    low: false,
    out: false,
    madeToOrder: false,
  };
}

function getVariantStockLabel(variant) {
  return getVariantStockMeta(variant).label;
}

function getComplimentaryTagLabel(value) {
  return value === "event_organiser_freebie" ? "Event organiser freebie" : "Giveaway";
}

function splitFullName(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      first_name: parts[0] || "",
      last_name: "",
    };
  }

  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function StripePosDeliveryAddressElement({ deliveryAddress, setDeliveryAddress, setDeliveryAddressComplete }) {
  const addressOptions = useMemo(
    () => ({
      mode: "shipping",
      allowedCountries: ["AU"],
      blockPoBox: false,
      ...(googleMapsApiKey
        ? {
            autocomplete: {
              mode: "google_maps_api",
              apiKey: googleMapsApiKey,
            },
          }
        : {}),
      fields: {
        phone: "always",
      },
      validation: {
        phone: {
          required: "never",
        },
      },
      defaultValues: {
        name: [deliveryAddress.first_name, deliveryAddress.last_name].filter(Boolean).join(" "),
        phone: deliveryAddress.phone || "",
        address: {
          line1: deliveryAddress.address_1 || "",
          line2: deliveryAddress.address_2 || "",
          city: deliveryAddress.city || "",
          state: deliveryAddress.province || "",
          postal_code: deliveryAddress.postal_code || "",
          country: (deliveryAddress.country_code || "au").toUpperCase(),
        },
      },
    }),
    []
  );

  return (
    <AddressElement
      options={addressOptions}
      onChange={(event) => {
        setDeliveryAddressComplete(Boolean(event.complete));

        const value = event.value || {};
        const address = value.address || {};
        const nameParts = splitFullName(value.name);

        setDeliveryAddress((prev) => ({
          ...prev,
          first_name: nameParts.first_name || prev.first_name,
          last_name: nameParts.last_name || prev.last_name,
          address_1: address.line1 || "",
          address_2: address.line2 || "",
          city: address.city || "",
          province: address.state || "",
          postal_code: address.postal_code || "",
          country_code: String(address.country || "AU").toLowerCase(),
          phone: value.phone || prev.phone || "",
        }));
      }}
    />
  );
}

function buildDefaultOptions(product) {
  const defaults = {};

  (product?.options || []).forEach((option) => {
    const optionName = normalizeOptionKey(option.title || option.name);
    if (!optionName) return;
    defaults[optionName] = "";
  });

  return defaults;
}

function deriveCartLines(posItems) {
  return posItems.map((entry) => {
    const basePrice = getVariantPrice(entry.variant);
    const lineSubtotal = basePrice * entry.quantity;
    const discountPercent = Math.min(100, Math.max(0, Number(entry.discountPercent || 0)));
    const discountAmount = lineSubtotal * (discountPercent / 100);
    const lineTotal = Math.max(0, lineSubtotal - discountAmount);

    return {
      key: `${entry.product.id}:${entry.variant.id}`,
      productId: entry.product.id,
      variantId: entry.variant.id,
      title: entry.product.title,
      variantTitle: entry.variant.title || "",
      price: basePrice,
      quantity: entry.quantity,
      subtotal: lineSubtotal,
      discountPercent,
      discountAmount,
      total: lineTotal,
      complimentaryTag: entry.complimentaryTag || "",
      stockLabel: getVariantStockLabel(entry.variant),
      stockMeta: getVariantStockMeta(entry.variant),
    };
  });
}

function getReaderLabel(reader) {
  return reader?.label || reader?.serial_number || reader?.id || "reader";
}

function getReaderLocationLabel(reader) {
  const location = reader?.location;

  if (!location) return "unscoped";
  if (typeof location === "string") return location;
  return location.display_name || location.id || "location";
}

const titleColorMatchers = [
  { phrase: "light grey", className: "text-zinc-300" },
  { phrase: "light gray", className: "text-zinc-300" },
  { phrase: "light blue", className: "text-sky-300" },
  { phrase: "charcoal", className: "text-zinc-500" },
  { phrase: "beige", className: "text-stone-300" },
  { phrase: "oatmeal", className: "text-stone-300" },
  { phrase: "white", className: "text-zinc-100" },
  { phrase: "black", className: "text-zinc-700" },
  { phrase: "pink", className: "text-pink-300" },
];

function getActionSummary(action) {
  if (!action) return "idle";
  return `${action.type} - ${action.status}`;
}

function renderProductTitle(title) {
  const parts = String(title || "").split(/(\s+)/);

  for (let i = 0; i < parts.length; i += 1) {
    if (!parts[i].trim()) continue;

    for (const matcher of titleColorMatchers) {
      const phraseWords = matcher.phrase.split(" ");
      const candidate = [];
      let cursor = i;

      while (cursor < parts.length && candidate.length < phraseWords.length) {
        if (parts[cursor].trim()) {
          candidate.push(parts[cursor]);
        }
        cursor += 1;
      }

      if (
        candidate.length === phraseWords.length &&
        candidate.map((word) => normalizeOptionValue(word)).join(" ") === matcher.phrase
      ) {
        const phraseEnd = cursor;
        const before = parts.slice(0, i).join("");
        const colored = parts.slice(i, phraseEnd).join("");
        const after = parts.slice(phraseEnd).join("");

        return (
          <>
            {before}
            <span className={matcher.className}>{colored}</span>
            {renderProductTitle(after)}
          </>
        );
      }
    }
  }

  return title;
}

function renderGuideTable(guide) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold uppercase text-white">{guide.title}</p>
      <p className="mt-2 text-xs text-white/55">{guide.description}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs text-white/75">
          <thead>
            <tr className="border-b border-white/10">
              {guide.columns.map((column) => (
                <th key={column} className="px-2 py-2 font-semibold uppercase tracking-[0.14em] text-white/55">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, rowIndex) => (
              <tr key={`${guide.title}-${rowIndex}`} className="border-b border-white/5 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={`${guide.title}-${rowIndex}-${cellIndex}`} className="px-2 py-2">
                    {cell || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-white/55">
        <span className="font-semibold text-white/75">How to measure:</span> {guide.howToMeasure}
      </p>
    </div>
  );
}


function getReceiptReferenceLabel(kind) {
  if (kind === "refund") return "Refund reference";
  if (kind === "cash") return "Cash reference";
  if (kind === "complimentary") return "Complimentary reference";
  return "Payment reference";
}

function buildSaleReceipt({
  kind,
  reference,
  orderId,
  items,
  subtotal,
  discountTotal,
  total,
  receiptEmail,
  customerMobile,
  operatorName,
  eventName,
  cashReceived,
  changeGiven,
  delivery,
  readerLabel,
}) {
  return {
    type: "sale",
    kind,
    title:
      kind === "cash"
        ? "Cash Sale Receipt"
        : kind === "complimentary"
          ? "Complimentary Receipt"
          : "Card Sale Receipt",
    reference,
    orderId,
    createdAt: new Date().toISOString(),
    items: items || [],
    subtotal: Number(subtotal || 0),
    discountTotal: Number(discountTotal || 0),
    total: Number(total || 0),
    receiptEmail: receiptEmail || "",
    customerMobile: customerMobile || "",
    operatorName: operatorName || "",
    eventName: eventName || "",
    cashReceived: cashReceived == null ? null : Number(cashReceived || 0),
    changeGiven: changeGiven == null ? null : Number(changeGiven || 0),
    delivery: delivery || null,
    readerLabel: readerLabel || "",
  };
}

function buildRefundReceipt({
  reference,
  orderId,
  paymentIntentId,
  amount,
  note,
  restocked,
  items,
  originalSale,
}) {
  return {
    type: "refund",
    kind: "refund",
    title: "Refund Receipt",
    reference,
    orderId,
    paymentIntentId,
    createdAt: new Date().toISOString(),
    amount: Number(amount || 0),
    note: note || "",
    restocked: Boolean(restocked),
    items: items || [],
    originalSale: originalSale || null,
  };
}

function ReceiptPanel({ receipt, onPrint, onClose }) {
  if (!receipt) return null;

  const isRefund = receipt.type === "refund";
  const receiptItems = isRefund ? receipt.items : receipt.items;
  const deliveryAddress = receipt.delivery?.required ? receipt.delivery?.address || null : null;

  return (
    <div className="mt-5 rounded-[1.75rem] border border-yellow-300/20 bg-yellow-300/[0.06] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-yellow-200/75">Receipt Ready</p>
          <p className="mt-2 text-sm text-white/65">Print this for the customer or for event records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            className={`rounded-full bg-yellow-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90 ${tapButtonClass}`}
          >
            Print Receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 hover:border-white/35 hover:text-white ${tapButtonClass}`}
          >
            Hide
          </button>
        </div>
      </div>

      <div className="pos-receipt-print rounded-2xl bg-white p-5 text-black shadow-xl">
        <div>
          <div className="flex items-start justify-between gap-3">
            <img
              src={receiptLogo}
              alt="Exit Smiling"
              className="h-[4.5rem] w-auto object-contain"
            />
            <div className="text-right">
              <img
                src={receiptQrCode}
                alt="Exit Smiling website QR code"
                className="ml-auto h-16 w-16 object-contain"
              />
              <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-zinc-500">Scan for site/socials</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-600">Merch Stand POS</p>
            <p className="mt-1 text-xs text-zinc-500">www.exitsmiling.com.au</p>
            <p className="mt-2 text-sm font-semibold uppercase">{receipt.title}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {new Date(receipt.createdAt).toLocaleString("en-AU")}
          </p>
        </div>

        <div className="mt-5 space-y-1 border-y border-zinc-200 py-3 text-xs">
          <p><span className="font-semibold">{getReceiptReferenceLabel(receipt.kind)}:</span> {receipt.reference || receipt.paymentIntentId || "n/a"}</p>
          {receipt.orderId ? <p><span className="font-semibold">Medusa order:</span> {receipt.orderId}</p> : null}
          {receipt.paymentIntentId && receipt.paymentIntentId !== receipt.reference ? (
            <p><span className="font-semibold">PaymentIntent:</span> {receipt.paymentIntentId}</p>
          ) : null}
          {receipt.eventName ? <p><span className="font-semibold">Event:</span> {receipt.eventName}</p> : null}
          {receipt.operatorName ? <p><span className="font-semibold">Operator:</span> {receipt.operatorName}</p> : null}
          {receipt.readerLabel ? <p><span className="font-semibold">Reader:</span> {receipt.readerLabel}</p> : null}
          {receipt.receiptEmail ? <p><span className="font-semibold">Email:</span> {receipt.receiptEmail}</p> : null}
          {receipt.customerMobile ? <p><span className="font-semibold">Mobile:</span> {receipt.customerMobile}</p> : null}
        </div>

        <div className="mt-4 space-y-3 text-sm">
          {receiptItems.length ? (
            receiptItems.map((item, index) => (
              <div key={`${item.variant_id || item.order_item_id || index}-${index}`} className="flex justify-between gap-4 border-b border-zinc-100 pb-2 last:border-b-0">
                <div>
                  <p className="font-semibold">{item.title || item.order_item_id || "Item"}</p>
                  {item.variant_title ? <p className="text-xs text-zinc-500">{item.variant_title}</p> : null}
                  <p className="text-xs text-zinc-500">
                    Qty {item.quantity || 0}
                    {Number(item.discount_percent || 0) > 0 ? ` | ${Number(item.discount_percent || 0)}% discount` : ""}
                    {item.complimentary_tag ? ` | ${getComplimentaryTagLabel(item.complimentary_tag)}` : ""}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(isRefund ? Number(item.refund_total || item.line_total || 0) : Number(item.line_total || 0))}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No line items recorded.</p>
          )}
        </div>

        {isRefund ? (
          <div className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between text-lg font-black">
              <span>Refunded</span>
              <span>{formatCurrency(receipt.amount)}</span>
            </div>
            {receipt.note ? <p className="text-xs text-zinc-500">Note: {receipt.note}</p> : null}
            <p className="text-xs text-zinc-500">Inventory: {receipt.restocked ? "Restocked" : "Not restocked"}</p>
          </div>
        ) : (
          <div className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(receipt.discountTotal)}</span></div>
            <div className="flex justify-between text-lg font-black"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
            {receipt.cashReceived != null ? (
              <>
                <div className="flex justify-between"><span>Cash received</span><span>{formatCurrency(receipt.cashReceived)}</span></div>
                <div className="flex justify-between"><span>Change given</span><span>{formatCurrency(receipt.changeGiven || 0)}</span></div>
              </>
            ) : null}
          </div>
        )}

        {deliveryAddress ? (
          <div className="mt-5 border-t border-zinc-200 pt-4 text-xs text-zinc-600">
            <p className="font-semibold uppercase text-black">Shipping Address</p>
            <p>{[deliveryAddress.first_name, deliveryAddress.last_name].filter(Boolean).join(" ")}</p>
            <p>{[deliveryAddress.address_1, deliveryAddress.address_2].filter(Boolean).join(", ")}</p>
            <p>{[deliveryAddress.city, deliveryAddress.province, deliveryAddress.postal_code].filter(Boolean).join(" ")}</p>
            {deliveryAddress.phone ? <p>{deliveryAddress.phone}</p> : null}
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs uppercase tracking-[0.14em] text-zinc-500">
          Thanks for supporting Exit Smiling's first Tour
        </p>
      </div>
    </div>
  );
}
function createRequestKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `refund-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const tapButtonClass =
  "transition duration-150 active:scale-[0.97] active:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70";

const selectedPillClass =
  "border-yellow-300 bg-yellow-300 text-black shadow-[0_0_0_1px_rgba(250,204,21,0.65),0_0_22px_rgba(250,204,21,0.28)]";

const idlePillClass =
  "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/28 hover:text-white";

const staffOperatorNames = [
  "Ayano Clark Mori",
  "Keryn White",
  "Dani Cotte",
  "Emma Harvey",
  "Nadine Butler",
  "Paul Dolphin",
  "Ben Clark",
  "Andrew White",
  "Guido Fenini",
  "Ben Butler",
  "Jude",
  "Seb",
  "Cadence",
  "Lando",
  "Julian",
  "Max",
  "Joey",
];
export default function PosApp() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOptionsByProduct, setSelectedOptionsByProduct] = useState({});
  const [posItems, setPosItems] = useState([]);
  const [terminalError, setTerminalError] = useState("");
  const [terminalStatusMessage, setTerminalStatusMessage] = useState(
    "Prepare a reader, build the sale, then send the payment to the smart reader."
  );
  const [receiptEmail, setReceiptEmail] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [deliveryRequired, setDeliveryRequired] = useState(false);
  const [deliveryAddressComplete, setDeliveryAddressComplete] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    province: "",
    postal_code: "",
    country_code: "au",
    phone: "",
  });
  const [cashReceived, setCashReceived] = useState("");
  const [cashNote, setCashNote] = useState("Cash sale");
  const [complimentaryNote, setComplimentaryNote] = useState("Complimentary sale");
  const [operatorName, setOperatorName] = useState("");
  const [eventName, setEventName] = useState("");
  const [simulateReader, setSimulateReader] = useState(true);
  const [loadingReaders, setLoadingReaders] = useState(false);
  const [registeringReader, setRegisteringReader] = useState(false);
  const [readerRegistrationCode, setReaderRegistrationCode] = useState("");
  const [readers, setReaders] = useState([]);
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [posLocation, setPosLocation] = useState(null);
  const [paying, setPaying] = useState(false);
  const [cashSaleLoading, setCashSaleLoading] = useState(false);
  const [complimentarySaleLoading, setComplimentarySaleLoading] = useState(false);
  const [activeSale, setActiveSale] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundPaymentIntentId, setRefundPaymentIntentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("POS refund");
  const [refundRestock, setRefundRestock] = useState(true);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  const [refundItemQuantities, setRefundItemQuantities] = useState({});
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [pressedPreview, setPressedPreview] = useState(null);

  const playTapSound = () => {
    if (typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(820, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(560, context.currentTime + 0.045);

      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.085);
      oscillator.onended = () => {
        context.close().catch(() => {});
      };
    } catch {
    }
  };

  const withTapSound = (handler) => (...args) => {
    playTapSound();
    return handler(...args);
  };

  const printLastReceipt = () => {
    if (!lastReceipt) return;
    window.print();
  };
  const refreshCatalog = async () => {
    try {
      setCatalogError("");
      const catalog = await getProducts();
      setProducts(catalog);
      setSelectedOptionsByProduct((prev) =>
        Object.fromEntries(
          catalog.map((product) => [
            product.id,
            {
              ...buildDefaultOptions(product),
              ...(prev[product.id] || {}),
            },
          ])
        )
      );
      return catalog;
    } catch (error) {
      setCatalogError(error.message || "Failed to refresh POS catalog.");
      return null;
    }
  };

  const refreshSalesHistory = async () => {
    try {
      setSalesLoading(true);
      setSalesError("");
      const result = await getPosSales({ limit: 20 });
      setSalesHistory(result.sales || []);
      setSalesSummary(result.summary || null);
      return result;
    } catch (error) {
      setSalesError(error.message || "Failed to load POS sales.");
      return null;
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingProducts(true);
        await Promise.all([refreshCatalog(), refreshSalesHistory()]);
      } catch (error) {
        setCatalogError(error.message || "Failed to load POS catalog.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadCatalog();
  }, []);

  useEffect(() => {
    async function initLocation() {
      try {
        const result = await ensurePosLocation();
        setPosLocation(result.location);
      } catch (error) {
        setTerminalError(error.message || "Failed to prepare POS location.");
      }
    }

    initLocation();
  }, []);

  useEffect(() => {
    if (!activeSale?.paymentIntentId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const status = await getTerminalSaleStatus({
          paymentIntentId: activeSale.paymentIntentId,
          readerId: activeSale.readerId,
        });

        if (cancelled) return;

        const paymentIntentStatus = status?.payment_intent?.status || "unknown";
        const readerActionStatus = status?.reader?.action?.status || "idle";
        setActiveSale((prev) =>
          prev
            ? {
                ...prev,
                status,
              }
            : prev
        );

        if (paymentIntentStatus === "succeeded" || paymentIntentStatus === "requires_capture") {
          setPaying(false);
          setPaymentResult({
            amount: (status.payment_intent.amount || 0) / 100,
            id: status.payment_intent.id,
            status: paymentIntentStatus,
          });

            try {
              const finalizeResult = await finalizePosSale({
                paymentIntentId: status.payment_intent.id,
                items: activeSale?.items || [],
              });
              await refreshCatalog();
              await refreshSalesHistory();
              setRefundOrderId(finalizeResult?.order_id || "");
              setRefundPaymentIntentId(status.payment_intent.id || "");
              setRefundAmount("");
              setRefundResult(null);
              setTerminalStatusMessage(
                finalizeResult?.order_id
                  ? `Payment succeeded. Inventory synced and Medusa order ${finalizeResult.order_id} created.`
                  : "Payment succeeded. Inventory synced for the next customer."
              );
              setPaymentResult({
                amount: (status.payment_intent.amount || 0) / 100,
                id: status.payment_intent.id,
                status: paymentIntentStatus,
                orderId: finalizeResult?.order_id || "",
              });
              setLastReceipt(buildSaleReceipt({
                kind: "card",
                reference: status.payment_intent.id,
                orderId: finalizeResult?.order_id || "",
                items: activeSale?.items || [],
                subtotal: activeSale?.subtotal ?? (status.payment_intent.amount || 0) / 100,
                discountTotal: activeSale?.discountTotal || 0,
                total: activeSale?.total ?? (status.payment_intent.amount || 0) / 100,
                receiptEmail: activeSale?.receiptEmail || "",
                customerMobile: activeSale?.customerMobile || "",
                operatorName: activeSale?.operatorName || "",
                eventName: activeSale?.eventName || "",
                delivery: activeSale?.delivery || null,
                readerLabel: activeSale?.readerLabel || getReaderLabel(status?.reader),
              }));
              setPosItems([]);
              setReceiptEmail("");
              setCustomerMobile("");
              clearDeliveryCapture();
            } catch (error) {
            setTerminalError(
              error.message ||
                "Payment succeeded, but the Medusa inventory sync did not complete."
            );
            setTerminalStatusMessage(
              "Payment succeeded, but inventory sync needs attention before the next sale."
            );
          }

          return;
        }

        const readerFailure = status?.reader?.action?.failure_message;
        const paymentFailure = status?.payment_intent?.last_payment_error?.message;

        if (readerFailure || paymentFailure) {
          const failureMessage = paymentFailure || readerFailure;
          setPaying(false);
          setTerminalError(failureMessage || "The reader reported a payment failure.");
          setTerminalStatusMessage("Payment did not complete. Review the reader and try again.");
          return;
        }

        window.setTimeout(poll, 2000);
      } catch (error) {
        if (cancelled) return;
        setPaying(false);
        setTerminalError(error.message || "Failed to poll Terminal sale status.");
      }
    };

    window.setTimeout(poll, 1600);

    return () => {
      cancelled = true;
    };
  }, [activeSale?.paymentIntentId, activeSale?.readerId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      `${product.title} ${product.subtitle || ""}`.toLowerCase().includes(normalizedSearch)
    );
  }, [products, searchTerm]);

  const cartLines = useMemo(() => deriveCartLines(posItems), [posItems]);
  const cartSubtotal = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.subtotal, 0),
    [cartLines]
  );
  const cartDiscountTotal = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.discountAmount, 0),
    [cartLines]
  );
  const cartTotal = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.total, 0),
    [cartLines]
  );
  const cartCount = useMemo(
    () => cartLines.reduce((sum, item) => sum + item.quantity, 0),
    [cartLines]
  );
  const complimentaryLineCount = useMemo(
    () => cartLines.filter((item) => item.complimentaryTag).length,
    [cartLines]
  );
  const cartNeedsShippingAddress = useMemo(
    () => cartLines.some((item) => item.stockMeta?.madeToOrder),
    [cartLines]
  );

  const selectedReader = readers.find((reader) => reader.id === selectedReaderId) || null;
  const selectedRefundSale =
    salesHistory.find((sale) => sale.id === refundOrderId.trim()) || null;
  const selectedRefundItems = selectedRefundSale
    ? (selectedRefundSale.items || [])
        .map((item) => ({
          order_item_id: item.id,
          quantity: Number(refundItemQuantities[item.id] || 0),
        }))
        .filter((item) => item.quantity > 0)
    : [];
  const selectedRefundPreviewAmount = selectedRefundSale
    ? selectedRefundItems.reduce((sum, selectedItem) => {
        const saleItem = (selectedRefundSale.items || []).find((item) => item.id === selectedItem.order_item_id);
        if (!saleItem) return sum;
        const quantity = Number(saleItem.quantity || 0);
        const lineTotal = Number(saleItem.total || 0);
        const unitAmount = quantity > 0 ? lineTotal / quantity : 0;
        return sum + unitAmount * selectedItem.quantity;
      }, 0)
    : 0;
  const selectedRefundHistory = selectedRefundSale?.refund_history || [];
  const cashReceivedAmount = Number(cashReceived || 0);
  const cashDelta = cashReceivedAmount - cartTotal;
  const cashChangeGiven = cashDelta > 0 ? cashDelta : 0;
  const cashStillOwed = cashDelta < 0 ? Math.abs(cashDelta) : 0;
  const hasCompleteDeliveryAddress =
    Boolean(deliveryAddress.first_name?.trim()) &&
    Boolean(deliveryAddress.last_name?.trim()) &&
    Boolean(deliveryAddress.address_1?.trim()) &&
    Boolean(deliveryAddress.city?.trim()) &&
    Boolean(deliveryAddress.province?.trim()) &&
    /^\d{4}$/.test(String(deliveryAddress.postal_code || "").trim()) &&
    String(deliveryAddress.country_code || "").toLowerCase() === "au";

  const shouldPromptForShippingAddress = cartNeedsShippingAddress && !hasCompleteDeliveryAddress;
  const hasActiveCart = cartLines.length > 0;
  const hasCashEntry = String(cashReceived || "").trim() !== "" && cashReceivedAmount > 0;
  const canRecordCashSale = hasActiveCart && !cashSaleLoading && cashStillOwed <= 0;
  const canRecordComplimentarySale = hasActiveCart && !complimentarySaleLoading && cartTotal === 0 && complimentaryLineCount > 0;
  const shouldPulseComplimentaryCheckout = canRecordComplimentarySale && !shouldPromptForShippingAddress;
  const shouldPulseCashCheckout = !shouldPulseComplimentaryCheckout && hasCashEntry && canRecordCashSale && !shouldPromptForShippingAddress;
  const cardCheckoutIsExpected =
    hasActiveCart &&
    !shouldPulseComplimentaryCheckout &&
    !shouldPulseCashCheckout &&
    !hasCashEntry &&
    !shouldPromptForShippingAddress &&
    !paying;
  const shouldPromptForReaderRegistration = cardCheckoutIsExpected && !selectedReaderId;
  const shouldPulseCardCheckout = cardCheckoutIsExpected && Boolean(selectedReaderId);
  const checkoutPulseClass = "animate-[posCheckoutGlow_1.15s_ease-in-out_infinite] ring-2 ring-yellow-200/80";
  const readerPromptPulseClass = "animate-[posReaderGlow_1.15s_ease-in-out_infinite] opacity-100 ring-2 ring-red-300/80";

  const getDeliveryPayload = () =>
    deliveryRequired
      ? {
          required: true,
          address: {
            ...deliveryAddress,
            postal_code: String(deliveryAddress.postal_code || "").trim(),
            country_code: "au",
          },
        }
      : {
          required: false,
          address: null,
        };

  const assertDeliveryReady = () => {
    if (!deliveryRequired) return true;

    if (!hasCompleteDeliveryAddress) {
      setTerminalError("Complete the delivery address before recording this POS sale.");
      return false;
    }

    return true;
  };

  const clearDeliveryCapture = () => {
    setDeliveryRequired(false);
    setDeliveryAddressComplete(false);
    setDeliveryAddress({
      first_name: "",
      last_name: "",
      address_1: "",
      address_2: "",
      city: "",
      province: "",
      postal_code: "",
      country_code: "au",
      phone: "",
    });
  };

  const refreshReaders = async ({ preferSimulated = simulateReader } = {}) => {
    try {
      setLoadingReaders(true);
      setTerminalError("");

      const effectiveLocationId = posLocationId || posLocation?.id || "";
      const result = await listTerminalReaders({
        locationId: effectiveLocationId || undefined,
        simulated: preferSimulated ? true : undefined,
      });

      setReaders(result.readers || []);

      if (!selectedReaderId && result.readers?.length) {
        setSelectedReaderId(result.readers[0].id);
      }

      setTerminalStatusMessage(
        result.readers?.length
          ? "Select the reader you want this iPad to control."
          : "No readers found yet."
      );
    } catch (error) {
      setTerminalError(error.message || "Failed to load readers.");
    } finally {
      setLoadingReaders(false);
    }
  };

  const handleRegisterReader = async () => {
    const registrationCode = readerRegistrationCode.trim().toLowerCase();

    if (!registrationCode) {
      setTerminalError("Enter the registration code shown on the S710.");
      return;
    }

    try {
      setRegisteringReader(true);
      setTerminalError("");
      setPaymentResult(null);

      const effectiveLocationId = posLocationId || posLocation?.id || "";
      const result = await registerTerminalReader({
        registrationCode,
        locationId: effectiveLocationId || undefined,
        label: "Exit Smiling S710",
      });

      setSimulateReader(false);
      setReaderRegistrationCode("");
      setSelectedReaderId(result.reader?.id || "");
      await refreshReaders({ preferSimulated: false });
      setTerminalStatusMessage("S710 registered. Select it below, then send a test sale to the reader.");
    } catch (error) {
      setTerminalError(error.message || "Failed to register S710 reader.");
    } finally {
      setRegisteringReader(false);
    }
  };
  const handlePrepareReader = async () => {
    try {
      setTerminalError("");
      setPaymentResult(null);

      if (simulateReader) {
        const effectiveLocationId = posLocationId || posLocation?.id || "";
        const result = await ensureSimulatedReader({
          locationId: effectiveLocationId || undefined,
        });
      }

      await refreshReaders({ preferSimulated: simulateReader });
    } catch (error) {
      setTerminalError(error.message || "Failed to prepare reader.");
    }
  };

  const handleOptionChange = (productId, optionName, value) => {
    const normalizedOptionName = normalizeOptionKey(optionName);

    setSelectedOptionsByProduct((prev) => {
      const next = {
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [normalizedOptionName]: value,
        },
      };

      if (normalizedOptionName === "type") {
        const product = products.find((entry) => entry.id === productId);
        const nextType = normalizeOptionValue(value);

        const validSizes = Array.from(
          new Set(
            (product?.variants || [])
              .filter((variant) => {
                const variantOptionMap = getVariantOptionMap(variant);
                return variantOptionMap["type"] === nextType;
              })
              .map((variant) => {
                const variantOptionMap = getVariantOptionMap(variant);
                return variantOptionMap["size"];
              })
              .filter(Boolean)
          )
        );

        const currentSize = normalizeOptionValue(next[productId]?.size);

        if (currentSize && !validSizes.includes(currentSize)) {
          next[productId].size = "";
        }
      }

      return next;
    });
  };

  const handleAddProduct = (product) => {
    const selectedOptions = selectedOptionsByProduct[product.id] || {};
    const variant = findMatchingVariant(product, selectedOptions);

    if (!variant) {
      setTerminalError("Choose the required merch options before adding this product.");
      return;
    }

    const inventoryQuantity = getVariantInventoryQuantity(variant);

    if (
      variant.manage_inventory &&
      !variant.allow_backorder &&
      inventoryQuantity != null &&
      inventoryQuantity <= 0
    ) {
      setTerminalError("That variant is out of stock on the Medusa backend.");
      return;
    }

      setTerminalError("");
      const stockMeta = getVariantStockMeta(variant);
      if (stockMeta.madeToOrder) {
        setTerminalStatusMessage("This variant is made to order. Let the customer know it will take longer to deliver.");
      } else if (stockMeta.low) {
        setTerminalStatusMessage(`Low stock warning: ${stockMeta.label}.`);
      }

      setPosItems((prev) => {
      if (!prev.length && lastReceipt) {
        setLastReceipt(null);
      }

      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

        return [...prev, { product, variant, quantity: 1, discountPercent: 0 }];
      });
  };

  const updateCartQuantity = (variantId, nextQuantity) => {
    setPosItems((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((item) => item.variant.id !== variantId);
      }

      return prev.map((item) =>
        item.variant.id === variantId ? { ...item, quantity: nextQuantity } : item
      );
    });
  };

  const updateCartDiscount = (variantId, nextDiscountPercent) => {
    setPosItems((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              discountPercent: Math.min(100, Math.max(0, Number(nextDiscountPercent) || 0)),
              complimentaryTag: Number(nextDiscountPercent) >= 100 ? item.complimentaryTag || "" : "",
            }
          : item
      )
    );
  };

  const updateComplimentaryTag = (variantId, complimentaryTag) => {
    setPosItems((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              discountPercent: complimentaryTag ? 100 : item.discountPercent,
              complimentaryTag,
            }
          : item
      )
    );
  };

  const handleTakePayment = async () => {
    if (!selectedReaderId) {
      setTerminalError("Select a reader before taking payment.");
      return;
    }

    if (!cartLines.length) {
      setTerminalError("Add at least one item to the POS cart before taking payment.");
      return;
    }

    if (!assertDeliveryReady()) return;

    setPaying(true);
    setTerminalError("");
    setPaymentResult(null);
    setTerminalStatusMessage("Sending sale to smart reader...");

    try {
      const saleItems = cartLines.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        variant_title: item.variantTitle,
        unit_price: item.price,
        quantity: item.quantity,
        discount_percent: item.discountPercent,
        discount_amount: item.discountAmount,
        line_total: item.total,
        complimentary_tag: item.complimentaryTag,
      }));
      const deliveryPayload = getDeliveryPayload();

        const result = await startTerminalSale({
          reader_id: selectedReaderId,
          amount: Math.round(cartTotal * 100),
          currency: "aud",
          description: `Exit Smiling merch stand sale (${cartCount} item${cartCount === 1 ? "" : "s"})`,
          receipt_email: receiptEmail.trim().toLowerCase() || undefined,
          metadata: {
            source: "pos_ipad_server_driven",
            customer_mobile: customerMobile.trim(),
            operator_name: operatorName.trim(),
            event_name: eventName.trim(),
            cart_subtotal_display: formatCurrency(cartSubtotal),
            cart_discount_display: formatCurrency(cartDiscountTotal),
            cart_total_display: formatCurrency(cartTotal),
            delivery_required: deliveryPayload.required ? "true" : "false",
            delivery_name: deliveryPayload.required
              ? `${deliveryPayload.address.first_name} ${deliveryPayload.address.last_name}`.trim()
              : "",
            delivery_address_1: deliveryPayload.address?.address_1 || "",
            delivery_address_2: deliveryPayload.address?.address_2 || "",
            delivery_city: deliveryPayload.address?.city || "",
            delivery_province: deliveryPayload.address?.province || "",
            delivery_postal_code: deliveryPayload.address?.postal_code || "",
            delivery_country_code: deliveryPayload.address?.country_code || "",
            delivery_phone: deliveryPayload.address?.phone || "",
          },
          items: saleItems,
      });

      setActiveSale({
        paymentIntentId: result.payment_intent.id,
        readerId: result.reader.id,
        status: result,
        items: saleItems,
        subtotal: cartSubtotal,
        discountTotal: cartDiscountTotal,
        total: cartTotal,
        receiptEmail: receiptEmail.trim().toLowerCase(),
        customerMobile: customerMobile.trim(),
        operatorName: operatorName.trim(),
        eventName: eventName.trim(),
        delivery: deliveryPayload,
        readerLabel: selectedReader ? getReaderLabel(selectedReader) : result.reader?.label || "",
      });

      setTerminalStatusMessage("Reader is waiting for card. Ask the customer to tap, insert, or swipe.");
    } catch (error) {
      setPaying(false);
      setTerminalError(error.message || "Failed to start Terminal sale.");
      setTerminalStatusMessage("Sale did not start. Check the reader and try again.");
    }
  };

  const handleCashSale = async () => {
    if (!cartLines.length) {
      setTerminalError("Add at least one item to the POS cart before recording a cash sale.");
      return;
    }

    if (!assertDeliveryReady()) return;

    if (cashReceivedAmount < cartTotal) {
      setTerminalError(`Cash received is short by ${formatCurrency(cashStillOwed)}.`);
      return;
    }

    setCashSaleLoading(true);
    setTerminalError("");
    setPaymentResult(null);
    setTerminalStatusMessage("Recording cash sale and syncing inventory...");

    try {
      const saleItems = cartLines.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        variant_title: item.variantTitle,
        unit_price: item.price,
        quantity: item.quantity,
        discount_percent: item.discountPercent,
        discount_amount: item.discountAmount,
        line_total: item.total,
        complimentary_tag: item.complimentaryTag,
      }));
      const deliveryPayload = getDeliveryPayload();

      const result = await createCashPosSale({
        items: saleItems,
        receiptEmail: receiptEmail.trim().toLowerCase() || undefined,
        customerMobile: customerMobile.trim(),
        operatorName: operatorName.trim(),
        eventName: eventName.trim(),
        cashReceived: cashReceivedAmount,
        note: cashNote.trim() || undefined,
        delivery: deliveryPayload,
      });
      setRefundOrderId(result?.order_id || "");
      setRefundPaymentIntentId("");
      setRefundAmount("");
      setRefundResult(null);
      setTerminalStatusMessage(
        result?.order_id
          ? `Cash sale recorded. Medusa order ${result.order_id} created and inventory synced.`
          : "Cash sale recorded and inventory synced."
      );
      setPaymentResult({
        amount: Number(result?.sale_total || cartTotal),
        id: result?.cash_sale_reference || "cash",
        status: "cash",
        orderId: result?.order_id || "",
      });
      setLastReceipt(buildSaleReceipt({
        kind: "cash",
        reference: result?.cash_sale_reference || "cash",
        orderId: result?.order_id || "",
        items: saleItems,
        subtotal: cartSubtotal,
        discountTotal: cartDiscountTotal,
        total: Number(result?.sale_total || cartTotal),
        receiptEmail: receiptEmail.trim().toLowerCase(),
        customerMobile: customerMobile.trim(),
        operatorName: operatorName.trim(),
        eventName: eventName.trim(),
        cashReceived: cashReceivedAmount,
        changeGiven: cashChangeGiven,
        delivery: deliveryPayload,
      }));
      setPosItems([]);
      setReceiptEmail("");
      setCustomerMobile("");
      setCashReceived("");
      clearDeliveryCapture();
      Promise.allSettled([refreshCatalog(), refreshSalesHistory()]).then((results) => {
        const failedRefresh = results.find((entry) => entry.status === "rejected");
        if (failedRefresh) {
          setSalesError("Sale recorded, but the POS list did not refresh. Use Refresh if needed.");
        }
      });
    } catch (error) {
      setTerminalError(error.message || "Failed to record cash sale.");
      setTerminalStatusMessage("Cash sale did not complete. Review the totals and try again.");
    } finally {
      setCashSaleLoading(false);
    }
  };

  const handleComplimentarySale = async () => {
    if (!cartLines.length) {
      setTerminalError("Add at least one item before recording a complimentary sale.");
      return;
    }

    if (cartTotal > 0) {
      setTerminalError("Complimentary sales require the cart total to be zero.");
      return;
    }

    if (!complimentaryLineCount) {
      setTerminalError("Mark at least one item as Giveaway or Event organiser freebie first.");
      return;
    }

    if (!assertDeliveryReady()) return;

    setComplimentarySaleLoading(true);
    setTerminalError("");
    setPaymentResult(null);
    setTerminalStatusMessage("Recording complimentary sale and syncing inventory...");

    try {
      const saleItems = cartLines.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        title: item.title,
        variant_title: item.variantTitle,
        unit_price: item.price,
        quantity: item.quantity,
        discount_percent: item.discountPercent,
        discount_amount: item.discountAmount,
        line_total: item.total,
        complimentary_tag: item.complimentaryTag,
      }));
      const deliveryPayload = getDeliveryPayload();

      const result = await createComplimentaryPosSale({
        items: saleItems,
        receiptEmail: receiptEmail.trim().toLowerCase() || undefined,
        customerMobile: customerMobile.trim(),
        operatorName: operatorName.trim(),
        eventName: eventName.trim(),
        note: complimentaryNote.trim() || undefined,
        delivery: deliveryPayload,
      });
      setRefundOrderId(result?.order_id || "");
      setRefundPaymentIntentId("");
      setRefundAmount("");
      setRefundResult(null);
      setTerminalStatusMessage(
        result?.order_id
          ? `Complimentary sale recorded. Medusa order ${result.order_id} created and inventory synced.`
          : "Complimentary sale recorded and inventory synced."
      );
      setPaymentResult({
        amount: 0,
        id: result?.complimentary_sale_reference || "complimentary",
        status: "complimentary",
        orderId: result?.order_id || "",
      });
      setLastReceipt(buildSaleReceipt({
        kind: "complimentary",
        reference: result?.complimentary_sale_reference || "complimentary",
        orderId: result?.order_id || "",
        items: saleItems,
        subtotal: cartSubtotal,
        discountTotal: cartDiscountTotal,
        total: 0,
        receiptEmail: receiptEmail.trim().toLowerCase(),
        customerMobile: customerMobile.trim(),
        operatorName: operatorName.trim(),
        eventName: eventName.trim(),
        delivery: deliveryPayload,
      }));
      setPosItems([]);
      setReceiptEmail("");
      setCustomerMobile("");
      clearDeliveryCapture();
      Promise.allSettled([refreshCatalog(), refreshSalesHistory()]).then((results) => {
        const failedRefresh = results.find((entry) => entry.status === "rejected");
        if (failedRefresh) {
          setSalesError("Sale recorded, but the POS list did not refresh. Use Refresh if needed.");
        }
      });
    } catch (error) {
      setTerminalError(error.message || "Failed to record complimentary sale.");
      setTerminalStatusMessage("Complimentary sale did not complete. Review the flags and try again.");
    } finally {
      setComplimentarySaleLoading(false);
    }
  };

  const handleRefundSale = async () => {
    if (!refundOrderId.trim() && !refundPaymentIntentId.trim()) {
      setTerminalError("Enter an order ID or payment intent ID before refunding.");
      return;
    }

    setRefundLoading(true);
    setTerminalError("");
    setRefundResult(null);

    try {
      const requestKey = createRequestKey();
      const result = await refundPosSale({
        orderId: refundOrderId.trim(),
        paymentIntentId: refundPaymentIntentId.trim(),
        amount:
          selectedRefundItems.length === 0 && refundAmount.trim()
            ? Number(refundAmount)
            : undefined,
        note: refundNote.trim() || undefined,
        restock: refundRestock,
        items: selectedRefundItems,
        requestKey,
      });

      await refreshCatalog();
      await refreshSalesHistory();
      setRefundResult(result);
      const refundReceiptItems = selectedRefundItems.length
        ? selectedRefundItems.map((selectedItem) => {
            const saleItem = (selectedRefundSale?.items || []).find(
              (item) => item.id === selectedItem.order_item_id
            );
            const originalQuantity = Number(saleItem?.quantity || 0);
            const unitTotal = originalQuantity > 0 ? Number(saleItem?.total || 0) / originalQuantity : 0;
            return {
              order_item_id: selectedItem.order_item_id,
              title: saleItem?.title || selectedItem.order_item_id,
              variant_title: saleItem?.variant_title || "",
              quantity: selectedItem.quantity,
              refund_total: unitTotal * selectedItem.quantity,
            };
          })
        : (selectedRefundSale?.items || []).map((item) => ({
            order_item_id: item.id,
            title: item.title,
            variant_title: item.variant_title,
            quantity: item.quantity,
            refund_total: item.total,
          }));
      setLastReceipt(buildRefundReceipt({
        reference: result?.refund_id || result?.request_key || requestKey,
        orderId: result?.order_id || refundOrderId.trim(),
        paymentIntentId: result?.payment_intent_id || refundPaymentIntentId.trim(),
        amount: result?.refunded_amount || selectedRefundPreviewAmount || Number(refundAmount || 0),
        note: refundNote.trim() || undefined,
        restocked: result?.restocked,
        items: refundReceiptItems,
        originalSale: selectedRefundSale,
      }));
      setRefundItemQuantities({});
      setTerminalStatusMessage(
        result?.restocked
          ? `Refund succeeded and stock was restored for order ${result.order_id}.`
          : `Refund succeeded for order ${result.order_id}.`
      );
    } catch (error) {
      setTerminalError(error.message || "Refund failed.");
      setTerminalStatusMessage("Refund did not complete. Review the sale IDs and try again.");
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`
        @keyframes posCheckoutGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(250,204,21,0.22), 0 0 12px rgba(250,204,21,0.18); }
          50% { box-shadow: 0 0 0 3px rgba(250,204,21,0.45), 0 0 30px rgba(250,204,21,0.52); }
        }

        @keyframes posReaderGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(248,113,113,0.24), 0 0 12px rgba(248,113,113,0.18); }
          50% { box-shadow: 0 0 0 3px rgba(248,113,113,0.5), 0 0 30px rgba(248,113,113,0.52); }
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .pos-receipt-print,
          .pos-receipt-print * {
            visibility: visible !important;
          }

          .pos-receipt-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            min-height: auto !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        <div className="relative mb-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_0_40px_rgba(255,255,255,0.04)] md:px-5 md:py-4">
          {heroImages.map((image, index) => (
            <div
              key={image}
              className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ${
                index === heroIndex ? "opacity-30" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${image})`,
                filter: "grayscale(100%) contrast(110%) brightness(0.72)",
              }}
            />
          ))}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_32%),linear-gradient(135deg,rgba(0,0,0,0.32),rgba(0,0,0,0.72))]" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_22px_rgba(250,204,21,0.12)] md:h-20 md:w-20">
                <img src={brandLogo} alt="Exit Smiling logo" className="h-full w-full object-contain p-2 opacity-95" />
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-[0.04em] text-white md:text-3xl">
                  Exit Smiling Merch Stand POS
                </h1>
                <img
                  src={smileyLogo}
                  alt="Exit Smiling smiley"
                  className="h-12 w-12 rounded-xl object-contain opacity-95 md:h-16 md:w-16"
                />
              </div>
            </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/75 transition hover:border-white/35 hover:text-white"
            >
              To Website
            </Link>
          </div>
        </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.62fr)]">
          <section className="order-1 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 lg:order-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Catalog</p>
                <h2 className="mt-2 text-2xl font-black uppercase">Merch Ready for the Table</h2>
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search merch"
                className="w-full max-w-xs rounded-full border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>

            {loadingProducts ? (
              <p className="text-white/60">Loading merch...</p>
            ) : catalogError ? (
              <p className="text-red-400">{catalogError}</p>
            ) : (
              <div className="grid gap-4 2xl:grid-cols-2">
                {filteredProducts.map((product) => {
                  const selectedOptions = selectedOptionsByProduct[product.id] || {};
                  const matchedVariant = findMatchingVariant(product, selectedOptions);
                  const displayPrice = matchedVariant ? getVariantPrice(matchedVariant) : null;
                  const sizeGuideType = detectSizeGuideType(product, selectedOptions);
                  const options = product.options || [];
                  const typeOption = options.find(
                    (option) => normalizeOptionKey(option.title || option.name) === "type"
                  );
                  const sizeOption = options.find(
                    (option) => normalizeOptionKey(option.title || option.name) === "size"
                  );
                  const otherOptions = options.filter((option) => {
                    const key = normalizeOptionKey(option.title || option.name);
                    return key !== "type" && key !== "size";
                  });
                  const selectedType = selectedOptions.type || "";
                  const availableSizesForSelectedType = Array.from(
                    new Set(
                      (product.variants || [])
                        .filter((variant) => {
                          const variantOptionMap = getVariantOptionMap(variant);
                          if (!selectedType) return true;
                          return variantOptionMap.type === normalizeOptionValue(selectedType);
                        })
                        .map((variant) => {
                          const variantOptionMap = getVariantOptionMap(variant);
                          return variantOptionMap.size;
                        })
                        .filter(Boolean)
                    )
                  );

                  return (
                    <article
                      key={product.id}
                      className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_0_30px_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={withTapSound(() =>
                            setPressedPreview((current) =>
                              current?.src === (product.thumbnail || product.images?.[0]?.url || "")
                                ? null
                                : {
                                    src: product.thumbnail || product.images?.[0]?.url || "",
                                    title: product.title,
                                  }
                            )
                          )}
                          className="overflow-hidden rounded-2xl"
                        >
                          <img
                            src={product.thumbnail || product.images?.[0]?.url || ""}
                            alt={product.title}
                            className="h-28 w-24 rounded-2xl object-cover transition duration-200 hover:scale-[1.02]"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-black uppercase leading-tight text-white">
                            {renderProductTitle(product.title)}
                          </h3>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                            {displayPrice != null ? formatCurrency(displayPrice) : "Choose options"}
                          </p>
                          <div className="mt-4 space-y-3">
                            {[typeOption, sizeOption, ...otherOptions].filter(Boolean).map((option) => {
                              const optionName = normalizeOptionKey(option.title || option.name);
                              const rawValues = Array.from(
                                new Set(
                                  (product.variants || [])
                                    .map((variant) => getVariantOptionMap(variant)[optionName])
                                    .filter(Boolean)
                                )
                              );
                              const values =
                                optionName === "size"
                                  ? rawValues.filter((value) =>
                                      availableSizesForSelectedType.includes(normalizeOptionValue(value))
                                    )
                                  : rawValues;

                              if (!values.length) return null;

                              return (
                                <div key={`${product.id}-${optionName}`}>
                                  <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/35">
                                    {option.title || option.name}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {values.map((value) => {
                                      const selected =
                                        normalizeOptionValue(selectedOptions[optionName]) ===
                                        normalizeOptionValue(value);
                                      const previewVariant =
                                        optionName === "size"
                                          ? findMatchingVariant(product, {
                                              ...selectedOptions,
                                              [optionName]: value,
                                            })
                                          : null;
                                      const stockLabel =
                                        optionName === "size"
                                          ? getVariantStockLabel(previewVariant)
                                          : "";
                                      const stockMeta =
                                        optionName === "size"
                                          ? getVariantStockMeta(previewVariant)
                                          : null;

                                      return (
                                        <button
                                          key={`${product.id}-${optionName}-${value}`}
                                          onClick={withTapSound(() => handleOptionChange(product.id, optionName, value))}
                                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                            selected
                                              ? selectedPillClass
                                              : idlePillClass
                                          } ${
                                            stockMeta?.out
                                              ? "border-red-400/60"
                                              : stockMeta?.low || stockMeta?.madeToOrder
                                                ? "border-yellow-300/45"
                                                : ""
                                          } ${tapButtonClass}`}
                                        >
                                          <span className="flex flex-col items-center gap-1">
                                            <span className="inline-flex items-center gap-2">
                                              {selected ? (
                                                <span className="inline-block h-2 w-2 rounded-full bg-black/80" />
                                              ) : null}
                                              {value}
                                            </span>
                                            {stockLabel ? (
                                              <span
                                                className={`text-[9px] normal-case tracking-normal ${
                                                  selected
                                                    ? "text-black/70"
                                                    : stockMeta?.out
                                                      ? "text-red-300"
                                                      : stockMeta?.low || stockMeta?.madeToOrder
                                                        ? "text-yellow-300"
                                                        : "text-white/45"
                                                }`}
                                              >
                                                {stockLabel}
                                              </span>
                                            ) : null}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {sizeGuideType ? (
                        <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                          <summary className="cursor-pointer list-none text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                            Size Guide +
                          </summary>
                          <div className="mt-3 text-left">
                            <p className="text-xs text-white/55">
                              Check size before ordering. This guide is based on body measurements for this product type.
                            </p>
                            <div className="mt-3">{renderGuideTable(sizeGuides[sizeGuideType])}</div>
                            <p className="mt-3 text-[10px] text-white/35">
                              Sizing is based on body measurements, not garment measurements. Measurements are approximate and may vary slightly between garment styles.
                            </p>
                          </div>
                        </details>
                      ) : null}

                      <button
                        onClick={withTapSound(() => handleAddProduct(product))}
                        className={`mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90 ${tapButtonClass}`}
                      >
                        Add to POS cart
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className={`order-2 max-h-[78vh] self-start overflow-y-auto [overflow-anchor:none] rounded-[1.5rem] border border-white/10 bg-[#080808]/95 p-3 text-[0.92rem] shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur md:sticky md:top-4 md:z-30 md:block md:max-h-[calc(100vh-2rem)] md:p-4 lg:top-6 lg:max-h-[calc(100vh-3rem)] ${cartLines.length || lastReceipt ? "fixed bottom-3 right-3 z-40 w-[46vw] min-w-[18rem] max-w-[24rem] md:sticky md:bottom-auto md:right-auto md:w-auto md:min-w-0 md:max-w-none" : "hidden md:block"}`}>
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Current Sale</p>
            <h2 className="mt-1 text-xl font-black uppercase md:text-2xl">POS Cart</h2>

            <div className="mt-4 space-y-3">
              {cartLines.length ? (
                cartLines.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-white/10 bg-black/35 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase text-white">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
                          {item.variantTitle || "Default variant"}
                        </p>
                        {item.complimentaryTag ? (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                            {getComplimentaryTagLabel(item.complimentaryTag)}
                          </p>
                        ) : null}
                        {item.stockLabel ? (
                          <p
                            className={`mt-1 text-[10px] uppercase tracking-[0.16em] ${
                              item.stockMeta?.out
                                ? "text-red-300"
                                : item.stockMeta?.low || item.stockMeta?.madeToOrder
                                  ? "text-yellow-300"
                                  : "text-white/40"
                            }`}
                          >
                            {item.stockLabel}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(item.total)}</p>
                        {item.discountPercent > 0 ? (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-yellow-300">
                            -{item.discountPercent}% applied
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/35">Discount</p>
                      <div className="flex flex-wrap gap-2">
                        {[0, 5, 10, 20, 50].map((discountOption) => {
                          const selected = item.discountPercent === discountOption;

                          return (
                            <button
                              key={`${item.key}-discount-${discountOption}`}
                              onClick={withTapSound(() => updateCartDiscount(item.variantId, discountOption))}
                              className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                                selected
                                  ? selectedPillClass
                                  : idlePillClass
                              } ${tapButtonClass}`}
                            >
                              {discountOption === 0 ? "No discount" : `${discountOption}% off`}
                            </button>
                          );
                        })}
                        {[
                          { label: "Freebie", value: "giveaway" },
                          { label: "Event organiser", value: "event_organiser_freebie" },
                        ].map((option) => {
                          const selected = item.complimentaryTag === option.value;

                          return (
                            <button
                              key={`${item.key}-comp-${option.value}`}
                              onClick={withTapSound(() => updateComplimentaryTag(item.variantId, selected ? "" : option.value))}
                              className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                                selected ? selectedPillClass : idlePillClass
                              } ${tapButtonClass}`}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                          Custom %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={item.discountPercent > 0 ? item.discountPercent : ""}
                          placeholder="0"
                          onChange={(event) => updateCartDiscount(item.variantId, event.target.value)}
                          className="w-24 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-yellow-300"
                        />
                      </div>
                      {item.discountPercent > 0 ? (
                        <p className="mt-3 text-xs text-white/55">
                          Subtotal {formatCurrency(item.subtotal)} - Discount {formatCurrency(item.discountAmount)}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={withTapSound(() => updateCartQuantity(item.variantId, item.quantity - 1))}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 hover:border-white/30 hover:text-white ${tapButtonClass}`}
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={withTapSound(() => updateCartQuantity(item.variantId, item.quantity + 1))}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 hover:border-white/30 hover:text-white ${tapButtonClass}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={withTapSound(() => updateCartQuantity(item.variantId, 0))}
                        className={`text-xs uppercase tracking-[0.18em] text-red-300/90 hover:text-red-200 ${tapButtonClass}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/12 bg-black/25 p-6 text-sm text-white/50">
                  No items yet. Add merch on the left to build the sale.
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Customer Contact (optional)</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30">Receipt Email</label>
                  <input
                    type="email"
                    value={receiptEmail}
                    onChange={(event) => setReceiptEmail(event.target.value)}
                    placeholder="customer@email.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/30">Mobile Number</label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(event) => setCustomerMobile(event.target.value)}
                    placeholder="04xx xxx xxx"
                    autoComplete="tel"
                    inputMode="tel"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Delivery</p>
                  <p className="mt-2 text-sm text-white/65">
                    Capture a shipping address for made-to-order or post-event delivery.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={withTapSound(() => {
                    setDeliveryRequired((prev) => !prev);
                    setTerminalError("");
                  })}
                  className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    deliveryRequired ? selectedPillClass : idlePillClass
                  } ${shouldPromptForShippingAddress ? "animate-[posCheckoutGlow_1.15s_ease-in-out_infinite] border-yellow-300 bg-yellow-300 text-black" : ""} ${tapButtonClass}`}
                >
                  {shouldPromptForShippingAddress
                    ? deliveryRequired
                      ? "Address needed"
                      : "Add address"
                    : deliveryRequired
                      ? "Delivery on"
                      : "Delivery off"}
                </button>
              </div>

              {deliveryRequired ? (
                <div className="mt-4">
                  {addressStripePromise ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <Elements
                        stripe={addressStripePromise}
                        options={{
                          appearance: {
                            theme: "night",
                            variables: {
                              colorBackground: "#111111",
                              colorText: "#ffffff",
                              colorDanger: "#f87171",
                              borderRadius: "14px",
                            },
                          },
                        }}
                      >
                        <StripePosDeliveryAddressElement
                          deliveryAddress={deliveryAddress}
                          setDeliveryAddress={setDeliveryAddress}
                          setDeliveryAddressComplete={setDeliveryAddressComplete}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">
                      Stripe address entry is unavailable because the publishable key is missing.
                    </p>
                  )}
                  <p
                    className={`mt-3 text-[10px] uppercase tracking-[0.18em] ${
                      deliveryAddressComplete || hasCompleteDeliveryAddress
                        ? "text-emerald-300"
                        : "text-yellow-300"
                    }`}
                  >
                    {deliveryAddressComplete || hasCompleteDeliveryAddress
                      ? "Delivery address ready"
                      : "Complete address before sale"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Cash Sale</p>
                  <p className="mt-2 text-sm text-white/65">
                    Enter funds received to record a cash-only sale without Stripe.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-300/25 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  No Stripe
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Funds Received</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="0.00"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Cash Note</label>
                  <input
                    type="text"
                    value={cashNote}
                    onChange={(event) => setCashNote(event.target.value)}
                    placeholder="Cash sale"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Cash Received</p>
                  <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(cashReceivedAmount)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {cashStillOwed > 0 ? "Still Owed" : "Change Given"}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${cashStillOwed > 0 ? "text-red-300" : "text-emerald-300"}`}>
                    {formatCurrency(cashStillOwed > 0 ? cashStillOwed : cashChangeGiven)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sale Total</p>
                  <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(cartTotal)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Complimentary Sale</p>
                  <p className="mt-2 text-sm text-white/65">
                    Use for giveaways or event organiser freebies. Mark the relevant item lines above first.
                  </p>
                </div>
                <div className="rounded-full border border-sky-300/25 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Zero total
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Flagged Lines</p>
                  <p className="mt-2 text-sm font-semibold text-white">{complimentaryLineCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Cart Total</p>
                  <p className={`mt-2 text-sm font-semibold ${cartTotal === 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {formatCurrency(cartTotal)}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Complimentary Note</label>
                  <input
                    type="text"
                    value={complimentaryNote}
                    onChange={(event) => setComplimentaryNote(event.target.value)}
                    placeholder="Complimentary sale"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-yellow-300/15 bg-yellow-300/[0.05] p-4">
              <div className="mb-4">
                <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Staff Member</label>
                <select
                  value={operatorName}
                  onChange={(event) => setOperatorName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white"
                >
                  <option className="bg-white text-black" value="">Select staff member</option>
                  {staffOperatorNames.map((name) => (
                    <option className="bg-white text-black" key={name} value={name}>{name}</option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Printed on receipt and saved with the sale.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/45">Subtotal</span>
                  <span className="text-lg font-semibold text-white/85">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/45">Discounts</span>
                  <span className="text-lg font-semibold text-yellow-300">
                    -{formatCurrency(cartDiscountTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/45">Total</span>
                  <span className="text-3xl font-black text-white">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <button
                onClick={withTapSound(handleTakePayment)}
                disabled={!cartLines.length || !selectedReaderId || paying}
                className={`mt-5 w-full rounded-full bg-yellow-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${shouldPulseCardCheckout ? checkoutPulseClass : ""} ${shouldPromptForReaderRegistration ? readerPromptPulseClass : ""} ${tapButtonClass}`}
              >
                {paying ? "Waiting for reader..." : "Send payment to reader"}
              </button>
              {shouldPromptForReaderRegistration ? (
                <div className="mt-3 rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-xs text-red-100">
                  <p className="font-semibold uppercase tracking-[0.18em]">Reader needed</p>
                  <p className="mt-2 text-red-100/80">
                    Enter the code shown on the S710 in Admin / Setup below, then load/select the live reader before card payment.
                  </p>
                </div>
              ) : null}
              <button
                onClick={withTapSound(handleCashSale)}
                disabled={!cartLines.length || cashSaleLoading || cashStillOwed > 0}
                className={`mt-3 w-full rounded-full bg-emerald-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${shouldPulseCashCheckout ? checkoutPulseClass : ""} ${tapButtonClass}`}
              >
                {cashSaleLoading ? "Recording cash sale..." : "Record cash sale"}
              </button>
              <button
                onClick={withTapSound(handleComplimentarySale)}
                disabled={!cartLines.length || complimentarySaleLoading || cartTotal > 0 || complimentaryLineCount === 0}
                className={`mt-3 w-full rounded-full bg-sky-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${shouldPulseComplimentaryCheckout ? checkoutPulseClass : ""} ${tapButtonClass}`}
              >
                {complimentarySaleLoading ? "Recording complimentary sale..." : "Record complimentary sale"}
              </button>
              <ReceiptPanel
                receipt={lastReceipt}
                onPrint={printLastReceipt}
                onClose={() => setLastReceipt(null)}
              />
            </div>
          </aside>
        </div>
        {cartLines.length || lastReceipt ? <div className="h-[52vh] md:hidden" /> : null}
        <div className="mb-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Reader Control</p>
                <h2 className="mt-2 text-2xl font-black uppercase">Server-Driven Terminal</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowChecklist((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 transition hover:border-white/35 hover:text-white"
                >
                  Checklist
                </button>
                <label className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70">
                  <input
                    type="checkbox"
                    checked={simulateReader}
                    onChange={(event) => {
                      setSimulateReader(event.target.checked);
                      setSelectedReaderId("");
                      setReaders([]);
                    }}
                    className="h-4 w-4 accent-yellow-300"
                  />
                  Simulated Reader
                </label>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Location</p>
                <p className="mt-2 text-lg font-semibold uppercase text-white">
                  {posLocation?.display_name || "Preparing"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Selected Reader</p>
                <p className="mt-2 text-lg font-semibold uppercase text-white">
                  {selectedReader ? getReaderLabel(selectedReader) : "None"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Sale Status</p>
                <p className="mt-2 text-lg font-semibold uppercase text-white">
                  {activeSale?.status?.payment_intent?.status || (paying ? "pending" : "idle")}
                </p>
              </div>
            </div>


            {salesSummary ? (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Today Total</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(salesSummary.today?.gross_total || 0)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {salesSummary.today?.order_count || 0} orders
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Card Sales</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(salesSummary.today_reconciliation?.by_payment_method?.card?.gross_total || 0)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {salesSummary.today_reconciliation?.by_payment_method?.card?.order_count || 0} orders
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Cash Sales</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatCurrency(salesSummary.today_reconciliation?.by_payment_method?.cash?.gross_total || 0)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {salesSummary.today_reconciliation?.by_payment_method?.cash?.order_count || 0} orders
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Today Refunded</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(salesSummary.today?.refunded_total || 0)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {salesSummary.today?.units_sold || 0} units
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">End of Day</p>
                      <p className="mt-2 text-sm text-white/65">
                        Reconciliation snapshot for today&apos;s venue sales.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Net Sales</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(salesSummary.today?.net_total || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Discounts</p>
                      <p className="mt-2 text-lg font-semibold text-yellow-300">
                        {formatCurrency(salesSummary.today_reconciliation?.discount_total || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Avg Sale</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatCurrency(salesSummary.today_reconciliation?.average_order_value || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Refund Events</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {salesSummary.today_reconciliation?.refund_event_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Top Products</p>
                      <div className="mt-3 space-y-3">
                        {(salesSummary.today_reconciliation?.top_products || []).length ? (
                          salesSummary.today_reconciliation.top_products.map((item) => (
                            <div key={item.title} className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase text-white">{item.title}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  {item.units_sold} sold | {item.refunded_units} refunded
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-white">{formatCurrency(item.gross_total || 0)}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-yellow-300">
                                  Discount {formatCurrency(item.discount_total || 0)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/55">No product sales today.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Top Sizes / Variants</p>
                      <div className="mt-3 space-y-3">
                        {(salesSummary.today_reconciliation?.top_variants || []).length ? (
                          salesSummary.today_reconciliation.top_variants.map((item) => (
                            <div key={item.label} className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase text-white">{item.label}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  {item.units_sold} sold | {item.refunded_units} refunded
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-white">{formatCurrency(item.gross_total || 0)}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-yellow-300">
                                  Discount {formatCurrency(item.discount_total || 0)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/55">No variant sales today.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Operator Breakdown</p>
                      <div className="mt-3 space-y-3">
                        {(salesSummary.today_reconciliation?.operator_breakdown || []).length ? (
                          salesSummary.today_reconciliation.operator_breakdown.map((item) => (
                            <div key={item.operator_name} className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase text-white">{item.operator_name}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  {item.order_count} sales
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-white">{formatCurrency(item.gross_total || 0)}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  Net {formatCurrency(item.net_total || 0)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/55">No operator activity today.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {showChecklist ? (
              <div className="mt-5 rounded-[1.5rem] border border-yellow-300/16 bg-yellow-300/[0.06] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-yellow-200/65">Operator Checklist</p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white">Before You Sell</p>
                  </div>
                  <button
                    onClick={() => setShowChecklist(false)}
                    className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/35 hover:text-white"
                  >
                    Hide
                  </button>
                </div>
                <ol className="mt-4 space-y-3 text-sm text-white/72">
                  <li>1. Register your WisePOS E or S700/S710 reader in Stripe and assign it to a Terminal location.</li>
                  <li>2. Use the iPad only as the POS screen; the backend now controls the reader.</li>
                  <li>3. Use `Prepare simulated reader` when working in simulator mode, or load your live readers when the hardware is available.</li>
                  <li>4. Once a reader is selected, add merch and send the sale to the reader.</li>
                </ol>
                <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-black/25 p-4 text-sm text-yellow-100/80">
                  This avoids the iPad browser-side reader connection issues you were seeing. The reader is now driven from
                  backend Stripe API calls, which is the direction Stripe recommends for smart readers.
                </div>
              </div>
            ) : null}

            <p className="mt-4 text-sm text-white/65">{terminalStatusMessage}</p>
            {terminalError ? <p className="mt-3 text-sm text-red-400">{terminalError}</p> : null}
              {paymentResult ? (
                <p className="mt-3 text-sm text-emerald-300">
                  {paymentResult.status === "complimentary"
                    ? "Complimentary sale recorded."
                    : `Paid ${formatCurrency(paymentResult.amount)} successfully.`}{" "}
                  {paymentResult.status === "cash"
                    ? "Cash reference"
                    : paymentResult.status === "complimentary"
                      ? "Complimentary reference"
                      : "PaymentIntent"}{" "}
                  {paymentResult.id}
                  {paymentResult.orderId ? ` - Medusa order ${paymentResult.orderId}.` : "."}
                </p>
              ) : null}



              <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/35 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Sale Refund</p>
                    <p className="mt-2 text-sm text-white/65">
                      Refund a completed POS sale, by whole order or selected line items, and optionally restore inventory.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Medusa Order ID</label>
                    <input
                      type="text"
                      value={refundOrderId}
                      onChange={(event) => setRefundOrderId(event.target.value)}
                      placeholder="order_..."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">PaymentIntent ID</label>
                    <input
                      type="text"
                      value={refundPaymentIntentId}
                      onChange={(event) => setRefundPaymentIntentId(event.target.value)}
                      placeholder="pi_..."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Refund Amount (optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      placeholder={
                        selectedRefundItems.length
                          ? "Ignored while line items are selected"
                          : "Leave blank for full refund"
                      }
                      disabled={selectedRefundItems.length > 0}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Refund Note</label>
                    <input
                      type="text"
                      value={refundNote}
                      onChange={(event) => setRefundNote(event.target.value)}
                      placeholder="POS refund"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                {selectedRefundSale ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Selected Sale Detail</p>
                        <p className="mt-2 text-sm font-semibold uppercase text-white">
                          #{selectedRefundSale.display_id || selectedRefundSale.id?.slice(-6) || "sale"} {selectedRefundSale.label ? `- ${selectedRefundSale.label}` : ""}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                          {selectedRefundSale.operator_name || "No operator"} | {selectedRefundSale.event_name || "No venue"}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                          {selectedRefundSale.units_sold} units | {new Date(selectedRefundSale.created_at).toLocaleString("en-AU")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{formatCurrency(selectedRefundSale.total)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Refunded {formatCurrency(selectedRefundSale.refunded_amount || 0)}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                          Net {formatCurrency(selectedRefundSale.net_total || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Payment Ref</p>
                        <p className="mt-2 break-all text-xs text-white">
                          {selectedRefundSale.payment_method === "cash"
                            ? selectedRefundSale.cash_sale_reference || "Cash sale"
                            : selectedRefundSale.payment_method === "complimentary"
                              ? selectedRefundSale.complimentary_sale_reference || "Complimentary sale"
                              : selectedRefundSale.payment_intent_id || "n/a"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Order ID</p>
                        <p className="mt-2 break-all text-xs text-white">{selectedRefundSale.id}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Email</p>
                        <p className="mt-2 break-all text-xs text-white">{selectedRefundSale.email || "No receipt email"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Reader</p>
                        <p className="mt-2 break-all text-xs text-white">
                          {selectedRefundSale.payment_method === "cash"
                            ? "Cash drawer / hand cash"
                            : selectedRefundSale.payment_method === "complimentary"
                              ? "Complimentary / no payment"
                              : selectedRefundSale.reader_id || "n/a"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Subtotal</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {selectedRefundSale.cart_subtotal_display || formatCurrency(selectedRefundSale.total || 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Discounts</p>
                        <p className="mt-2 text-sm font-semibold text-yellow-300">
                          {selectedRefundSale.cart_discount_display || formatCurrency(0)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Total</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {selectedRefundSale.cart_total_display || formatCurrency(selectedRefundSale.total || 0)}
                        </p>
                      </div>
                    </div>

                    {selectedRefundSale.payment_method === "cash" ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Payment Method</p>
                          <p className="mt-2 text-sm font-semibold text-white">Cash</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Cash Received</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatCurrency(selectedRefundSale.cash_received_amount || 0)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Change Given</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatCurrency(selectedRefundSale.cash_change_given || 0)}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {selectedRefundSale.payment_method === "complimentary" ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Payment Method</p>
                          <p className="mt-2 text-sm font-semibold text-white">Complimentary</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Reason Tags</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {(selectedRefundSale.complimentary_tags || []).length
                              ? selectedRefundSale.complimentary_tags.join(" | ")
                              : "n/a"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Note</p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {selectedRefundSale.complimentary_note || "No note"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {selectedRefundSale.delivery_required ? (
                      <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/[0.05] p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-sky-200">Delivery Required</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {[
                            selectedRefundSale.delivery_address?.first_name,
                            selectedRefundSale.delivery_address?.last_name,
                          ].filter(Boolean).join(" ") || "Customer"}
                        </p>
                        <p className="mt-1 text-sm text-white/70">
                          {[
                            selectedRefundSale.delivery_address?.address_1,
                            selectedRefundSale.delivery_address?.address_2,
                            selectedRefundSale.delivery_address?.city,
                            selectedRefundSale.delivery_address?.province,
                            selectedRefundSale.delivery_address?.postal_code,
                          ].filter(Boolean).join(", ")}
                        </p>
                        {selectedRefundSale.delivery_address?.phone ? (
                          <p className="mt-1 text-sm text-white/55">
                            {selectedRefundSale.delivery_address.phone}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Selected Sale Items</p>
                      <p className="mt-2 text-sm text-white/65">
                        Choose quantities to refund and restock for this sale.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Refund Quantity Picker</p>
                        <p className="mt-2 text-sm text-white/65">
                          Pick the specific units to refund from this completed sale.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={withTapSound(() => {
                          const next = {};
                          for (const item of selectedRefundSale.items || []) {
                            const refundableQuantity = Number(item.refundable_quantity ?? item.quantity ?? 0);
                            if (refundableQuantity > 0) {
                              next[item.id] = refundableQuantity;
                            }
                          }
                          setRefundItemQuantities(next);
                        })}
                        className={`rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75 hover:border-white/35 hover:text-white ${tapButtonClass}`}
                      >
                        Select all refundable
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(selectedRefundSale.items || []).map((item) => {
                        const refundableQuantity = Number(item.refundable_quantity ?? item.quantity ?? 0);
                        const refundedQuantity = Number(item.refunded_quantity || 0);
                        const selectedQuantity = Number(refundItemQuantities[item.id] || 0);
                        const lineUnitAmount =
                          Number(item.quantity || 0) > 0
                            ? Number(item.total || 0) / Number(item.quantity || 0)
                            : 0;

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-black/30 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold uppercase text-white">{item.title}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  {item.variant_title || "Default variant"}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  Sold {item.quantity} • Refunded {refundedQuantity} • Remaining {refundableQuantity}
                                </p>
                                {item.complimentary_tag ? (
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                                    {getComplimentaryTagLabel(item.complimentary_tag)}
                                  </p>
                                ) : null}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-white">{formatCurrency(item.total)}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                  {formatCurrency(lineUnitAmount)} each
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-yellow-300">
                                  Discount {formatCurrency(item.discount_total || 0)}
                                  {Number(item.discount_percent || 0) > 0 ? ` | ${Number(item.discount_percent || 0)}%` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={withTapSound(() =>
                                    setRefundItemQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: Math.max(0, selectedQuantity - 1),
                                    }))
                                  )}
                                  disabled={selectedQuantity <= 0}
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 hover:border-white/30 hover:text-white disabled:opacity-30 ${tapButtonClass}`}
                                >
                                  -
                                </button>
                                <span className="min-w-[2.5rem] text-center text-sm font-semibold text-white">
                                  {selectedQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={withTapSound(() =>
                                    setRefundItemQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: Math.min(refundableQuantity, selectedQuantity + 1),
                                    }))
                                  )}
                                  disabled={selectedQuantity >= refundableQuantity}
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 hover:border-white/30 hover:text-white disabled:opacity-30 ${tapButtonClass}`}
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={withTapSound(() =>
                                  setRefundItemQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: refundableQuantity,
                                  }))
                                )}
                                disabled={refundableQuantity <= 0}
                                className={`rounded-full border border-white/12 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 hover:border-white/35 hover:text-white disabled:opacity-30 ${tapButtonClass}`}
                              >
                                Max
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Selected line-item refund
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(selectedRefundPreviewAmount)}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Refund History</p>
                      <div className="mt-3 space-y-3">
                        {selectedRefundHistory.length ? (
                          selectedRefundHistory
                            .slice()
                            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                            .map((entry) => (
                              <div
                                key={entry.request_key || entry.created_at}
                                className="rounded-2xl border border-white/10 bg-black/30 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold uppercase text-white">
                                      {entry.note || "Refund"}
                                    </p>
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                      {entry.created_at ? new Date(entry.created_at).toLocaleString("en-AU") : "No timestamp"}
                                    </p>
                                    {entry.items?.length ? (
                                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                        {entry.items
                                          .map((refundItem) => {
                                            const saleItem = (selectedRefundSale.items || []).find(
                                              (item) => item.id === refundItem.order_item_id
                                            );
                                            return `${refundItem.quantity} x ${saleItem?.title || refundItem.order_item_id}`;
                                          })
                                          .join(" | ")}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-white">
                                      {formatCurrency(entry.refunded_amount || 0)}
                                    </p>
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                      {entry.restocked ? "Restocked" : "No restock"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-white/55">No previous refunds on this sale.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <label className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70">
                  <input
                    type="checkbox"
                    checked={refundRestock}
                    onChange={() => setRefundRestock((prev) => !prev)}
                  />
                  {selectedRefundItems.length
                    ? "Restock inventory for selected refunded items"
                    : "Restock inventory on full refund"}
                </label>

                {refundResult ? (
                  <p className="mt-3 text-sm text-emerald-300">
                    Refunded {formatCurrency(refundResult.refunded_amount)} for order {refundResult.order_id}.
                    {refundResult.restocked ? " Inventory restored." : ""}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={withTapSound(handleRefundSale)}
                  disabled={refundLoading}
                  className={`mt-4 rounded-full border border-white/15 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${tapButtonClass}`}
                >
                  {refundLoading ? "Processing Refund..." : "Refund Selected Sale"}
                </button>
              </div>

              <details className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/35 p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/45">Recent Sales</p>
                      <p className="mt-2 text-sm text-white/65">
                        Load a recent POS order into the refund form or review gross and refund totals.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                      Open
                    </div>
                  </div>
                </summary>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={withTapSound(refreshSalesHistory)}
                    disabled={salesLoading}
                    className={`rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75 hover:border-white/35 hover:text-white disabled:opacity-40 ${tapButtonClass}`}
                  >
                    {salesLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>
                {salesError ? <p className="mt-3 text-sm text-red-400">{salesError}</p> : null}

                <div className="mt-4 space-y-3">
                  {salesHistory.length ? (
                    salesHistory.slice(0, 8).map((sale) => (
                      <button
                        key={sale.id}
                        type="button"
                        onClick={withTapSound(() => {
                          setRefundOrderId(sale.id || "");
                          setRefundPaymentIntentId(sale.payment_intent_id || "");
                          setRefundAmount("");
                          setRefundItemQuantities({});
                          setRefundResult(null);
                        })}
                        className={`w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-left transition hover:border-yellow-300/40 hover:bg-black/45 ${tapButtonClass}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase text-white">
                              #{sale.display_id || sale.id?.slice(-6) || "sale"} {sale.label ? `- ${sale.label}` : ""}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                              {sale.operator_name || "No operator"} | {sale.event_name || "No venue"}
                            </p>
                            {sale.delivery_required ? (
                              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-sky-300">
                                Delivery required
                              </p>
                            ) : null}
                            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                              {sale.units_sold} units | {new Date(sale.created_at).toLocaleString("en-AU")}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                              {sale.payment_method === "cash"
                                ? "Cash sale"
                                : sale.payment_method === "complimentary"
                                  ? "Complimentary sale"
                                  : "Card / reader sale"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatCurrency(sale.total)}</p>
                            {sale.refunded_amount > 0 ? (
                              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-yellow-300">
                                Refunded {formatCurrency(sale.refunded_amount)}
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                                {sale.payment_status || "paid"}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-white/55">No POS sales loaded yet.</p>
                  )}
                </div>
              </details>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={withTapSound(handlePrepareReader)}
                disabled={loadingReaders}
                className={`rounded-full bg-yellow-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${tapButtonClass}`}
              >
                {loadingReaders
                  ? "Loading..."
                  : simulateReader
                    ? "Prepare simulated reader"
                    : "Load live readers"}
              </button>
              <button
                onClick={withTapSound(() => {
                  setSimulateReader(false);
                  setSelectedReaderId("");
                  refreshReaders({ preferSimulated: false });
                })}
                disabled={loadingReaders}
                className={`rounded-full border border-yellow-300/35 bg-yellow-300/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-100 hover:border-yellow-300/70 hover:bg-yellow-300/20 disabled:cursor-not-allowed disabled:opacity-40 ${tapButtonClass}`}
              >
                Load live readers
              </button>
              <button
                onClick={withTapSound(() => refreshReaders({ preferSimulated: simulateReader }))}
                disabled={loadingReaders}
                className={`rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${tapButtonClass}`}
              >
                Refresh current mode
              </button>
            </div>

            {!!readers.length && (
              <div className="mt-4 space-y-3">
                {readers.map((reader) => (
                  <button
                    key={reader.id}
                    onClick={withTapSound(() => setSelectedReaderId(reader.id))}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      selectedReaderId === reader.id
                        ? "border-yellow-300 bg-yellow-300/12 shadow-[0_0_0_1px_rgba(250,204,21,0.5),0_0_20px_rgba(250,204,21,0.18)]"
                        : "border-white/10 bg-black/35 hover:border-yellow-300/40 hover:bg-black/55"
                    } ${tapButtonClass}`}
                  >
                    <div>
                      <p className="text-sm font-semibold uppercase text-white">{getReaderLabel(reader)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
                        {reader.device_type || "reader"} - {getReaderLocationLabel(reader)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-yellow-300">
                        {selectedReaderId === reader.id ? "Selected" : "Select"}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {reader.status || "unknown"} - {getActionSummary(reader.action)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>


        </div>


        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Admin / Setup</p>
            <h2 className="mt-2 text-2xl font-black uppercase">Event & Reader Settings</h2>
            <p className="mt-2 text-sm text-white/60">
              Setup fields live here so the sales surface stays focused during venue checkout.
            </p>
          </div>
            <div className="mt-5 grid gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Venue / Event</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="Venue or show name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-yellow-300/20 bg-yellow-300/[0.06] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[16rem] flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.24em] text-yellow-200/70">
                    S710 Registration Code
                  </label>
                  <input
                    type="text"
                    value={readerRegistrationCode}
                    onChange={(event) => setReaderRegistrationCode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleRegisterReader();
                      }
                    }}
                    placeholder="industry-near-toad"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mt-2 w-full rounded-2xl border border-yellow-300/20 bg-black/45 px-4 py-3 text-sm lowercase text-white placeholder:text-white/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={withTapSound(handleRegisterReader)}
                  disabled={registeringReader || !readerRegistrationCode.trim()}
                  className={`rounded-full bg-yellow-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${tapButtonClass}`}
                >
                  {registeringReader ? "Registering..." : "Register S710"}
                </button>
              </div>
              <p className="mt-3 text-xs text-white/55">
                Enter the code shown on the S710 screen, register it once, then turn off Simulated Reader and load live readers.
              </p>
            </div>
        </section>
      </div>
      {pressedPreview ? (
        <button
          type="button"
          onClick={withTapSound(() => setPressedPreview(null))}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <div className="max-h-[88vh] max-w-[88vw] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_0_50px_rgba(0,0,0,0.55)]">
            <img
              src={pressedPreview.src}
              alt={pressedPreview.title}
              className="max-h-[88vh] max-w-[88vw] object-contain"
            />
          </div>
        </button>
      ) : null}
    </div>
  );
}























