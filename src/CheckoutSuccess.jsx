import { useEffect } from "react";

export default function CheckoutSuccess() {
    useEffect(() => {
        localStorage.removeItem("exit_smiling_cart_id");
    }, []);

    return (
        <div className="min-h-screen bg-black px-6 text-white">
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
                <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Exit Smiling Store
                    </p>
                    <h1 className="mt-4 text-4xl font-black uppercase md:text-5xl">
                        Order Confirmed
                    </h1>
                    <p className="mt-4 text-white/70">
                        Thanks for supporting Exit Smiling. Your payment was received and your order is being processed. All merch proceeds go towards our Japan Tour
                    </p>
                    <p className="mt-3 text-sm text-white/55">
                        If you ordered a print-on-demand item you will receive your order after the custom print run. Thanks for your patience.
                    </p>
                    <a
                        href="/"
                        className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-black transition hover:opacity-90"
                    >
                        Back to Store
                    </a>
                </div>
            </div>
        </div>
    );
}
