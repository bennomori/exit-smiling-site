import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { completeCart } from "./cart";

function StripeCheckoutForm({ cartId, onSuccess, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || submitting) return;

        setSubmitting(true);
        setError("");

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (stripeError) {
            setError(stripeError.message || "Payment failed.");
            setSubmitting(false);
            return;
        }

        if (paymentIntent && paymentIntent.status !== "succeeded") {
            setError(`Payment status: ${paymentIntent.status}`);
            setSubmitting(false);
            return;
        }

        try {
            const result = await completeCart(cartId);

            if (result.type === "order" && result.order) {
                onSuccess(result.order);
                return;
            }

            if (result.type === "cart") {
                setError(result.error?.message || "Cart completion failed.");
            } else {
                setError("Unexpected completion response.");
            }
        } catch (err) {
            setError(err.message || "Failed to complete order.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
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
