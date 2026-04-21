export default function CheckoutCancel() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-xl text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Exit Smiling Store</p>
                <h1 className="mt-4 text-4xl font-black uppercase md:text-5xl">
                    Checkout Cancelled
                </h1>
                <p className="mt-4 text-white/70">
                    No problem — your cart is still waiting for you.
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <a
                        href="/"
                        className="rounded-full border border-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-black"
                    >
                        Return to Store
                    </a>
                </div>
            </div>
        </div>
    );
}