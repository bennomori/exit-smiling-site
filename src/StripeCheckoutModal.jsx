import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { completeCart } from "./cart";

const pendingOrderStorageKey = "exit_smiling_pending_order";

async function completeCartWithRetry(cartId, maxAttempts = 4) {
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            const result = await completeCart(cartId);

            if (result?.type === "order" && result.order) {
                return result;
            }

            if (result?.type === "cart") {
                lastError = new Error(result.error?.message || "Cart completion failed.");
            } else {
                lastError = new Error("Unexpected completion response.");
            }
        } catch (err) {
            lastError = err;
        }

        if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
        }
    }

    throw lastError || new Error("Failed to complete order.");
}

function getPaymentReference(paymentIntentId = "") {
    if (!paymentIntentId) return "Unknown";

    return paymentIntentId.slice(-8).toUpperCase();
}

function readPendingOrder(cartId) {
    if (!cartId || typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(pendingOrderStorageKey);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (parsed?.cartId !== cartId || !parsed?.paymentIntentId) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function writePendingOrder(cartId, paymentIntentId) {
    if (!cartId || !paymentIntentId || typeof window === "undefined") return;

    try {
        window.localStorage.setItem(
            pendingOrderStorageKey,
            JSON.stringify({
                cartId,
                paymentIntentId,
                savedAt: Date.now(),
            })
        );
    } catch {
    }
}

function clearPendingOrder(cartId) {
    if (!cartId || typeof window === "undefined") return;

    try {
        const pending = readPendingOrder(cartId);
        if (!pending) return;

        window.localStorage.removeItem(pendingOrderStorageKey);
    } catch {
    }
}

function StripeCheckoutForm({ cartId, onSuccess, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [pendingFinalization, setPendingFinalization] = useState(() => readPendingOrder(cartId));

    useEffect(() => {
        setPendingFinalization(readPendingOrder(cartId));
    }, [cartId]);

    const finalizeOrder = async (paymentIntentId) => {
        const reference = getPaymentReference(paymentIntentId);

        setSubmitting(true);
        setStatusMessage("Finalizing your order...");
        setError("");

        writePendingOrder(cartId, paymentIntentId);

        try {
            const result = await completeCartWithRetry(cartId);

            if (result.type === "order" && result.order) {
                clearPendingOrder(cartId);
                setPendingFinalization(null);
                onSuccess(result.order);
                return;
            }

            throw new Error("Unexpected completion response.");
        } catch (err) {
            const nextPending = { cartId, paymentIntentId };
            setPendingFinalization(nextPending);
            setError(
                `Your payment was confirmed, but we are still finalizing your order. Reference: ${reference}. ` +
                    `Please try 'Retry order finalization' below. If this continues, contact Exit Smiling with that reference.`
            );
        } finally {
            setStatusMessage("");
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || submitting) return;

        setSubmitting(true);
        setError("");
        setStatusMessage("Confirming payment...");

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed.");
            setStatusMessage("");
            setSubmitting(false);
            return;
        }

        if (paymentIntent && paymentIntent.status !== "succeeded") {
            setError(`Payment status: ${paymentIntent.status}`);
            setStatusMessage("");
            setSubmitting(false);
            return;
        }

        if (!paymentIntent?.id) {
            setError("Payment was confirmed, but a payment reference was not returned.");
            setStatusMessage("");
            setSubmitting(false);
            return;
        }

        setPendingFinalization({ cartId, paymentIntentId: paymentIntent.id });
        await finalizeOrder(paymentIntent.id);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {statusMessage ? <p className="text-sm text-white/70">{statusMessage}</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {pendingFinalization ? (
                <button
                    type="button"
                    onClick={() => finalizeOrder(pendingFinalization.paymentIntentId)}
                    disabled={submitting}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.15em] text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Retry order finalization
                </button>
            ) : null}
            <div className="flex items-center justify-between gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.15em] text-white/70 hover:bg-white/10 hover:text-white"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || !elements || submitting}
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {submitting ? "Processing..." : "Pay Now"}
                </button>
            </div>
        </form>
    );
}

export default function StripeCheckoutModal({
    open,
    clientSecret,
    cartId,
    onClose,
    onSuccess,
}) {
    const [stripePromise, setStripePromise] = useState(null);

    useEffect(() => {
        if (!open || !clientSecret) return;

        setStripePromise(loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
    }, [open, clientSecret]);

    const options = useMemo(
        () => ({
            clientSecret,
            appearance: {
                theme: "night",
                variables: {
                    colorBackground: "#0b0b0b",
                    colorText: "#ffffff",
                    colorDanger: "#f87171",
                    borderRadius: "16px",
                },
            },
        }),
        [clientSecret]
    );

    if (!open || !clientSecret) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#090909] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Secure Checkout</p>
                        <h2 className="mt-2 text-2xl font-bold uppercase text-white">Payment Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white/70 hover:bg-white/10 hover:text-white"
                    >
                        Close
                    </button>
                </div>

                {stripePromise ? (
                    <Elements stripe={stripePromise} options={options}>
                        <StripeCheckoutForm cartId={cartId} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                ) : null}
            </div>
        </div>
    );
}
