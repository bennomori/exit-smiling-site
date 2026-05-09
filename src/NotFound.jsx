import { Link } from "react-router-dom"

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/#gigs", label: "Gigs" },
  { href: "/#store", label: "Merch" },
  { href: "/epk", label: "EPK" },
]

export default function NotFound() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-white/8 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-yellow-200/70">
          Error 404
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-black uppercase leading-none tracking-[-0.05em] text-white md:text-8xl">
          This exit does not exist.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 md:text-lg">
          The page you were looking for has moved, vanished, or was never part of the setlist.
          Head back to the official Exit Smiling site.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:border-yellow-200/60 hover:bg-yellow-200 hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-14 max-w-xl rounded-3xl border border-white/10 bg-black/45 p-5 text-sm leading-7 text-white/54">
          <p className="font-black uppercase tracking-[0.2em] text-white/78">Useful links</p>
          <p className="mt-3">
            For press, venue, radio, or festival info, use the EPK. For merch, jump straight
            to the store section.
          </p>
        </div>
      </section>
    </main>
  )
}
