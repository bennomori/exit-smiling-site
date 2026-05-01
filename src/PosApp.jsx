import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "./getProducts";
import {
  ensurePosLocation,
  ensureSimulatedReader,
  getTerminalSaleStatus,
  listTerminalReaders,
  startTerminalSale,
} from "./posTerminal";

const posLocationId = String(import.meta.env.VITE_STRIPE_TERMINAL_LOCATION_ID || "").trim();
const brandLogo =
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1776305886/copy_of_exitsmilinglogo-white-blackbackground_qzq2fa_c8b4fb.png";
const heroImages = [
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615943/Exit_Smiling_-_01b_aiag6j.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615939/Exit_Smiling_-_03_kbggnz.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615934/Exit_Smiling_-_05_avhs0w.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_02_jp3xuz.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1777178649/band_bio_2_zy1uqv.jpg",
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
  const [simulateReader, setSimulateReader] = useState(true);
  const [loadingReaders, setLoadingReaders] = useState(false);
  const [readers, setReaders] = useState([]);
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [posLocation, setPosLocation] = useState(null);
  const [paying, setPaying] = useState(false);
  const [activeSale, setActiveSale] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);
  const [pressedPreview, setPressedPreview] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingProducts(true);
        setCatalogError("");
        const catalog = await getProducts();
        setProducts(catalog);
        setSelectedOptionsByProduct(
          Object.fromEntries(catalog.map((product) => [product.id, buildDefaultOptions(product)]))
        );
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
          setTerminalStatusMessage("Payment succeeded. Cart cleared for the next customer.");
          setPosItems([]);
          setReceiptEmail("");
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

  const selectedReader = readers.find((reader) => reader.id === selectedReaderId) || null;

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

    setTerminalError("");

    setPosItems((prev) => {
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

    setPaying(true);
    setTerminalError("");
    setPaymentResult(null);
    setTerminalStatusMessage("Sending sale to smart reader...");

    try {
      const result = await startTerminalSale({
        reader_id: selectedReaderId,
        amount: Math.round(cartTotal * 100),
        currency: "aud",
        description: `Exit Smiling merch stand sale (${cartCount} item${cartCount === 1 ? "" : "s"})`,
        receipt_email: receiptEmail.trim().toLowerCase() || undefined,
        metadata: {
          source: "pos_ipad_server_driven",
          cart_subtotal_display: formatCurrency(cartSubtotal),
          cart_discount_display: formatCurrency(cartDiscountTotal),
          cart_total_display: formatCurrency(cartTotal),
        },
        items: cartLines.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          title: item.title,
          variant_title: item.variantTitle,
          unit_price: item.price,
          quantity: item.quantity,
          discount_percent: item.discountPercent,
          discount_amount: item.discountAmount,
          line_total: item.total,
        })),
      });

      setActiveSale({
        paymentIntentId: result.payment_intent.id,
        readerId: result.reader.id,
        status: result,
      });

      setTerminalStatusMessage("Reader is waiting for card. Ask the customer to tap, insert, or swipe.");
    } catch (error) {
      setPaying(false);
      setTerminalError(error.message || "Failed to start Terminal sale.");
      setTerminalStatusMessage("Sale did not start. Check the reader and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-5 py-5 shadow-[0_0_40px_rgba(255,255,255,0.04)] md:px-7 md:py-6">
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
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-black/40 shadow-[0_0_28px_rgba(250,204,21,0.12)]">
                <img src={brandLogo} alt="Exit Smiling logo" className="h-24 w-24 object-contain opacity-95" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/75">POS Mode</p>
                <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.04em] text-white md:text-4xl">
                  Exit Smiling Merch Stand
                </h1>
                <p className="mt-3 max-w-[42rem] text-sm text-white/65">
                  Tablet-based POS using Stripe-Server-Driven-Stripe-Smart-Reader control &amp; our Medusa Product Catalog and Inventory backend.
                </p>
              </div>
            </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/75 transition hover:border-white/35 hover:text-white"
            >
              Back to Site
            </Link>
          </div>
        </div>
        </div>

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
                    onChange={(event) => setSimulateReader(event.target.checked)}
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
                  <li>3. For testing, use `Prepare simulated reader` to create or reuse Stripe's simulated WisePOS E.</li>
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
                Paid {formatCurrency(paymentResult.amount)} successfully. PaymentIntent {paymentResult.id}.
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handlePrepareReader}
                disabled={loadingReaders}
                className="rounded-full bg-yellow-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingReaders
                  ? "Loading..."
                  : simulateReader
                    ? "Prepare simulated reader"
                    : "Load live readers"}
              </button>
              <button
                onClick={() => refreshReaders({ preferSimulated: simulateReader })}
                disabled={loadingReaders}
                className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Refresh readers
              </button>
            </div>

            {!!readers.length && (
              <div className="mt-5 space-y-3">
                {readers.map((reader) => (
                  <button
                    key={reader.id}
                    onClick={() => setSelectedReaderId(reader.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                      selectedReaderId === reader.id
                        ? "border-yellow-300 bg-yellow-300/12"
                        : "border-white/10 bg-black/35 hover:border-yellow-300/40 hover:bg-black/55"
                    }`}
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

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
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
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredProducts.map((product) => {
                  const selectedOptions = selectedOptionsByProduct[product.id] || {};
                  const matchedVariant = findMatchingVariant(product, selectedOptions);
                  const displayPrice = matchedVariant ? getVariantPrice(matchedVariant) : null;
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
                          onClick={() =>
                            setPressedPreview((current) =>
                              current?.src === (product.thumbnail || product.images?.[0]?.url || "")
                                ? null
                                : {
                                    src: product.thumbnail || product.images?.[0]?.url || "",
                                    title: product.title,
                                  }
                            )
                          }
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

                                      return (
                                        <button
                                          key={`${product.id}-${optionName}-${value}`}
                                          onClick={() => handleOptionChange(product.id, optionName, value)}
                                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                                            selected
                                              ? "border-yellow-300 bg-yellow-300 text-black"
                                              : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/28 hover:text-white"
                                          }`}
                                        >
                                          {value}
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
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:opacity-90"
                      >
                        Add to POS cart
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Current Sale</p>
            <h2 className="mt-2 text-2xl font-black uppercase">POS Cart</h2>

            <div className="mt-5 space-y-3">
              {cartLines.length ? (
                cartLines.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase text-white">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
                          {item.variantTitle || "Default variant"}
                        </p>
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
                        {[0, 10, 20, 50].map((discountOption) => {
                          const selected = item.discountPercent === discountOption;

                          return (
                            <button
                              key={`${item.key}-discount-${discountOption}`}
                              onClick={() => updateCartDiscount(item.variantId, discountOption)}
                              className={`rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                                selected
                                  ? "border-yellow-300 bg-yellow-300 text-black"
                                  : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/28 hover:text-white"
                              }`}
                            >
                              {discountOption === 0 ? "No discount" : `${discountOption}% off`}
                            </button>
                          );
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
                          onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 transition hover:border-white/30 hover:text-white"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-lg text-white/80 transition hover:border-white/30 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => updateCartQuantity(item.variantId, 0)}
                        className="text-xs uppercase tracking-[0.18em] text-red-300/90 transition hover:text-red-200"
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

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <label className="block text-[10px] uppercase tracking-[0.24em] text-white/35">Receipt Email (optional)</label>
              <input
                type="email"
                value={receiptEmail}
                onChange={(event) => setReceiptEmail(event.target.value)}
                placeholder="customer@email.com"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-yellow-300/15 bg-yellow-300/[0.05] p-5">
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
                onClick={handleTakePayment}
                disabled={!cartLines.length || !selectedReaderId || paying}
                className="mt-5 w-full rounded-full bg-yellow-300 px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paying ? "Waiting for reader..." : "Send payment to reader"}
              </button>
            </div>
          </aside>
        </div>
      </div>
      {pressedPreview ? (
        <button
          type="button"
          onClick={() => setPressedPreview(null)}
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
