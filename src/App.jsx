import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { AddressElement, Elements } from "@stripe/react-stripe-js";
import { getProducts } from "./getProducts";
import { detectSizeGuideType, sizeGuides } from "./sizeGuides";
import StripeCheckoutModal from "./StripeCheckoutModal";
import { SiSpotify, SiApplemusic } from "react-icons/si";
import {
  createCart,
  addLineItem,
  getCart,
  initializeStripePayment,
  completeCart,
  updateLineItem,
  removeLineItem,
  updateCartDetails,
  listCartShippingOptions,
  replaceShippingMethods,
} from "./cart";
import { registerFanUpdatesAccess, verifyFanUpdatesAccess } from "./fanUpdates";

const primaryLogo = 'https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-white-on-black.png';
const markLogo = 'https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-yellow-transparent.png';
const heroLogoBlack = 'https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-black-transparent.png';
const heroLogoYellow = 'https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-yellow-transparent.png';
const heroLogoWhite = 'https://exit-smiling-media.bennoclark.workers.dev/logos/exit-smiling-logo-white-on-black.png';

const brand = {
  name: 'Exit Smiling',
  primaryLogo,
  markLogo,
  logoAlt: 'Exit Smiling official logo',
};

const previewAccessStorageKey = "exit_smiling_preview_access";
const previewUsername = "ES";
const previewPassword = "bakedbeans";
const privateMemberDetailsEnabled =
  String(import.meta.env.VITE_ENABLE_PRIVATE_MEMBER_DETAILS || "").toLowerCase() === "true";
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const addressStripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const defaultSlideDurationMs = 3000;
const heroImages = [
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-01.jpg', position: 'center' },
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-03.jpg', position: 'center' },
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-04.jpg', position: 'center' },
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-02.jpg', position: 'center' },
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-05.jpg', position: 'center' },
  { type: 'image', src: 'https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-06.jpg', position: 'center' },
];

const tourDates = [
  {
    date: 'APR 18',
    city: 'Moruya, NSW',
    venue: 'RSL Memorial Hall - 11 Page St, Moruya NSW 2537',
    time: '4PM-9PM AEST',
    href: 'https://www.eventbrite.com/e/currents-battle-of-the-bands-2026-live-youth-music-event-tickets-1981828560574',
    mapHref: 'https://maps.app.goo.gl/mTMXRXCejsmioYwb6',
    posterImage: 'https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/battle-of-the-bands-bobs.jpg',
    note: 'Currents: Battle of the Bands - Youth Week live music competition - Free event - Pizza, DJs, chill out spaces',
  },
  {
    date: 'APR 24',
    city: 'Tomakin, NSW',
    venue: "Smokey Dan's",
    time: 'Friday',
    href: 'https://events.humanitix.com/archie-at-smokey-dans-426/tickets?fbclid=IwY2xjawRKMDpleHRuA2FlbQIxMABicmlkETFGbmJIM3pkNXlDdklmWW9Vc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHin3kekDUp3KtzaNksuoRsJnoFDcdMcTgyPg986XG8ra6T20ev90Sl4nB4Gn_aem_7D5dBKgOLCSFaAtC_kBKjA',
    mapHref: 'https://maps.app.goo.gl/5GcQGcPbFMi9R5Rx8',
    posterImage: 'https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/archie-smokey-dans-ep-release.jpg',
    note: 'ARCHIE EP release tour (Together Apart) - with Grace Faletoese + Exit Smiling',
  },
  {
    date: 'MAY 2',
    city: 'Narooma, NSW',
    venue: 'Narooma Oyster Festival',
    time: '1PM',
    href: 'https://events.humanitix.com/narooma-oyster-festival-2026/tickets',
    mapHref: 'https://maps.app.goo.gl/L6tbtCGbjuTXrXi79',
    posterImage: 'https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/narooma-oyster-festival.jpg',
    note: 'Live show',
  },
  {
    date: 'MAY 16',
    city: 'Oyster Cove, NSW',
    venue: 'Oyster Cove Cocktail Bar',
    time: '7PM',
    href: '#',
    mapHref: 'https://maps.app.goo.gl/Ex1Qa4t2vH4ysSQP6',
    posterImage: 'https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/oyster-cove-gig-poster.png',
    note: 'Live show',
  },
  {
    date: 'JUN 12',
    city: 'Batemans Bay, NSW',
    venue: 'The Starfish Deli - Starfish Sessions (Upstairs)',
    time: '6:30PM-10PM AEST',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    mapHref: 'https://maps.app.goo.gl/7i9yxXRrR6kNqKd49',
    posterImage: 'https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/starfish-deli-single-launch.png',
    note: 'Debut single launch show',
  },
];

const videos = [
  { title: 'Music Video Coming Soon', label: 'Latest Single' },
  { title: 'Live Session', label: 'Behind the Scenes' },
  { title: 'ABC RADIO LIVE SHOW', label: 'LIVE IN ABC STUDIOS APRIL 29 2026' },
];

const pastGigPosterImages = [
  "https://exit-smiling-media.bennoclark.workers.dev/gigs/past/past-gig-poster-archive-01.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/gigs/posters/archie-smokey-dans-ep-release.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/gigs/past/archie-smokey-dans-crowd.jpg",
  "https://exit-smiling-media.bennoclark.workers.dev/gigs/past/halloween-gig-poster.jpg",
];

const exitSmilingDebutSingleCover =
  "https://exit-smiling-media.bennoclark.workers.dev/releases/exit-smiling-single-cover.png";
const exitSmilingDebutSingleCoverLarge =
  "https://exit-smiling-media.bennoclark.workers.dev/releases/exit-smiling-single-cover-large.png";

const releases = [
  {
    title: 'Debut Single - Exit Smiling',
    meta: 'Single - Releases Friday June 12, 2026',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    blurb: 'Launching live at Starfish Sessions in Batemans Bay.',
    image: exitSmilingDebutSingleCover,
    imageAlt: 'Exit Smiling Debut Single',
    previewVideo: {
      src: 'https://exit-smiling-media.bennoclark.workers.dev/releases/exit-smiling-single-teaser.mp4',
      disclaimer: "LIVE PREVIEW OF 'EXIT SMILING' by EXIT SMILING - OFFICIAL MASTERED SINGLE COMING SOON",
    },
    overlayText: 'PREVIEW ONLY - RELEASING ON APPLE MUSIC 6/12/26',
  },
  {
    title: 'Home Town Hero',
    meta: 'Single - TBD',
    href: '#',
    blurb: 'TBD single release.',
    image: 'https://exit-smiling-media.bennoclark.workers.dev/releases/hometown-hero-cover.png',
    imageAlt: 'Home Town Hero',
    previewVideo: {
      src: 'https://exit-smiling-media.bennoclark.workers.dev/videos/hometown-hero-preview.mp4',
      startAt: 6,
      endAt: 46,
      note: 'Band bio preview clip',
      disclaimer: 'LIVE PREVIEW - HOMETOWN HERO - OFFICIAL MASTERED SINGLE COMING SOON',
    },
  },
  {
    title: 'Lost In You',
    meta: 'Single - TBD',
    href: '#',
    blurb: 'TBD single release.',
    image: 'https://exit-smiling-media.bennoclark.workers.dev/releases/lost-in-you-cover.png',
    imageAlt: 'Lost In You Single',
    previewVideo: {
      src: 'https://exit-smiling-media.bennoclark.workers.dev/studio/studio-session-02-lost-in-you.mp4',
      startAt: 34,
      endAt: 54,
      note: 'Selected female-vocal preview clip',
      disclaimer: "LIVE PREVIEW OF 'LOST IN YOU' by EXIT SMILING - OFFICIAL MASTERED SINGLE COMING SOON",
    },
  },
];

const merch = [
  'Tour Tee',
  'Blackout Hoodie',
  'Caps',
  'Vinyl Bundle',
  'Signed Poster',
  'Accessories',
  'Guitar Picks',
  "Signed Tee's",
];

const fallbackMerchImage =
  "https://exit-smiling-media.bennoclark.workers.dev/merch/fallback-colourful-shirts.png";

const mostPopularProductImageOverrides = {
  // Add custom promo images by Medusa product title, handle, or id.
  // Example: "light grey hoodie black logo": "https://exit-smiling-media.bennoclark.workers.dev/merch/custom-hero.jpg",
};

const members = [
  { name: 'Cadence', role: 'Vocals' },
  { name: 'Lando', role: 'Vocals / Rhythm Guitar' },
  { name: 'Julian', role: 'Drums' },
  { name: 'Max', role: 'Bass Guitar' },
  { name: 'Joey', role: 'Lead Guitar' },
];

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 8.2a2.6 2.6 0 0 0-1.8-1.8C17.6 6 12 6 12 6s-5.6 0-7.2.4A2.6 2.6 0 0 0 3 8.2 27 27 0 0 0 2.6 12c0 1.3.1 2.5.4 3.8A2.6 2.6 0 0 0 4.8 17.6C6.4 18 12 18 12 18s5.6 0 7.2-.4a2.6 2.6 0 0 0 1.8-1.8c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8Z" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}



function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 4v8.2a3.7 3.7 0 1 1-2.6-3.6" />
      <path d="M14 4c.8 1.9 2.3 3 4.3 3.3" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.2l.5-3H12V6.7c0-.5.3-.7.7-.7H15V3Z" />
    </svg>
  );
}



const studioSessions = [
  {
    title: 'Studio Session 01',
    subtitle: 'Private rough edit',
    thumb: 'https://exit-smiling-media.bennoclark.workers.dev/studio/studio-session-01-cadence-thumbnail.png',
    video: 'https://exit-smiling-media.bennoclark.workers.dev/studio/studio-session-01-cadence.mp4',
  },
  {
    title: 'Studio Session 02',
    subtitle: 'Private rough edit',
    thumb: 'https://exit-smiling-media.bennoclark.workers.dev/studio/studio-session-02-lost-in-you-thumbnail.jpg',
    video: 'https://exit-smiling-media.bennoclark.workers.dev/studio/studio-session-02-lost-in-you.mp4',
  },
];

function Header({ cart, onToggleMiniCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const socialButtonClass = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition duration-500 hover:border-white/35 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]';
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const navItems = [
    { href: '#music', label: 'Music' },
    { href: '#tour', label: 'Gigs' },
    { href: '#videos', label: 'Videos' },
    { href: '#about', label: 'The Band' },
    { href: '#store', label: 'Merch' },
    { href: '#press-kit', label: 'EPK' },
  ];
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <a href="#top" className="flex items-center">
              <img src={brand.markLogo} alt={brand.logoAlt} decoding="async" className="h-16 w-16 object-contain md:h-20 md:w-20" />
              <span className="sr-only">{brand.name}</span>
            </a>
            <nav className="hidden gap-12 text-sm uppercase tracking-[0.2em] md:flex">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="relative text-white/80 transition hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-4 lg:gap-5">
            <div className="hidden items-center gap-2 md:flex">
              <a href="https://www.instagram.com/exitsmiling33/" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialButtonClass}>
                <InstagramIcon className="h-4 w-4" />
              </a>

              <a href="https://www.facebook.com/profile.php?id=61584318366927" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialButtonClass}>
                <FacebookIcon className="h-4 w-4" />
              </a>

              <a href="https://www.youtube.com/@ExitSmiling-u8i" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialButtonClass}>
                <YoutubeIcon className="h-4 w-4" />
              </a>

              <a href="#" aria-label="Spotify" className={socialButtonClass}>
                <SiSpotify className="h-4 w-4" />
              </a>

              <a href="#" aria-label="Apple Music" className={socialButtonClass}>
                <SiApplemusic className="h-4 w-4" />
              </a>

              <a href="https://www.tiktok.com/@exit_smiling" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialButtonClass}>
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10 md:hidden"
              aria-label="Open mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              Menu
            </button>
            <button
              onClick={onToggleMiniCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Open cart"
            >
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>
            <a href="https://events.humanitix.com/exit-smiling/tickets" target="_blank" rel="noreferrer" className="hidden rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-white hover:text-black sm:inline-flex">
              Get Tickets
            </a>
          </div>
        </div>
      </header>
      {mobileMenuOpen ? (
        <div className="fixed left-0 top-0 z-[999] h-dvh w-screen bg-black/90 px-4 py-5 text-white md:hidden">
          <button
            type="button"
            aria-label="Close mobile menu backdrop"
            onClick={closeMobileMenu}
            className="absolute inset-0 h-full w-full bg-black/90"
          />
          <div className="relative z-10 mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[#070707] p-5 shadow-[0_0_60px_rgba(0,0,0,0.72)]">
            <div className="flex items-center justify-between">
              <a href="#top" onClick={closeMobileMenu} className="flex items-center gap-3">
                <img src={brand.markLogo} alt={brand.logoAlt} decoding="async" className="h-14 w-14 object-contain" />
                <span className="text-sm font-black uppercase tracking-[0.24em] text-white">Exit Smiling</span>
              </a>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-full border border-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <nav className="mt-10 grid gap-3">
              {navItems.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-yellow-200/35 hover:bg-yellow-200/10"
                >
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block text-2xl font-black uppercase text-white transition group-hover:text-yellow-50">
                    {item.label}
                  </span>
                </a>
              ))}
            </nav>

            <div className="mt-6 grid gap-3">
              <a
                href="https://events.humanitix.com/exit-smiling/tickets"
                target="_blank"
                rel="noreferrer"
                onClick={closeMobileMenu}
                className="rounded-full bg-white px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90"
              >
                Get Tickets
              </a>
              <a
                href="/epk"
                onClick={closeMobileMenu}
                className="rounded-full border border-white/18 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              >
                Standalone EPK
              </a>
            </div>

            <div className="mt-auto border-t border-white/10 pt-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/35">Follow</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.instagram.com/exitsmiling33/" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialButtonClass}>
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61584318366927" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialButtonClass}>
                  <FacebookIcon className="h-4 w-4" />
                </a>
                <a href="https://www.youtube.com/@ExitSmiling-u8i" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialButtonClass}>
                  <YoutubeIcon className="h-4 w-4" />
                </a>
                <a href="https://www.tiktok.com/@exit_smiling" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialButtonClass}>
                  <TikTokIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H7" />
    </svg>
  );
}

function SectionTitle({ children, className = "" }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="pointer-events-none absolute inset-x-[-14%] inset-y-[5%] rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,214,10,0.48),rgba(255,214,10,0.16)_42%,transparent_74%)] opacity-100 blur-2xl animate-[sectionTitleGlow_4.5s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-x-[-4%] bottom-[-8%] h-[18%] rounded-full bg-yellow-300/35 blur-xl animate-[sectionTitleGlow_4.5s_ease-in-out_infinite]" />
      <h2 className="relative text-4xl font-black uppercase tracking-[0.02em] text-white drop-shadow-[0_0_14px_rgba(255,214,10,0.22)] animate-[sectionTitlePop_4.5s_ease-in-out_infinite] md:text-6xl">
        {children}
      </h2>
    </div>
  );
}

function HeroQuickActions() {
  const actions = [
    { href: "#music", label: "Listen", note: "Single teasers" },
    { href: "#videos", label: "Watch", note: "Live sessions" },
    { href: "#store", label: "Buy Merch", note: "Ships from Australia" },
    { href: "#fan-list", label: "Join List", note: "Gigs and release drops" },
  ];

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => (
        <a
          key={action.href}
          href={action.href}
          className="group rounded-2xl border border-white/10 bg-black/42 px-4 py-3 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-yellow-200/45 hover:bg-yellow-200/10 hover:shadow-[0_0_24px_rgba(250,204,21,0.14)]"
        >
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-white">
            {action.label}
          </span>
          <span className="mt-1 block text-xs text-white/52 transition group-hover:text-white/72">
            {action.note}
          </span>
        </a>
      ))}
    </div>
  );
}

function Hero({ currentImage, onSlideDurationChange, onOpenReleasePreview, onOpenHeroSingleImage }) {
  const currentHeroMedia = heroImages[currentImage];
  const [showHeroManifestoTile, setShowHeroManifestoTile] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShowHeroManifestoTile((prev) => !prev);
    }, showHeroManifestoTile ? 26640 : 10500);

    return () => window.clearInterval(interval);
  }, [showHeroManifestoTile]);

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <style>{`
        @keyframes heroReleaseOverlayPulse {
          0%, 18%, 82%, 100% {
            opacity: 0.76;
            transform: rotate(-24deg) scale(0.94);
          }
          26%, 74% {
            opacity: 0;
            transform: rotate(-24deg) scale(0.9);
          }
        }
        @keyframes heroCatch22ImagePulse {
          0%, 12%, 88%, 100% {
            opacity: 0;
            transform: rotate(-14deg) scale(0.86);
            filter: grayscale(100%) contrast(1.2) brightness(0.88);
          }
          24%, 72% {
            opacity: 0.48;
            transform: rotate(-14deg) scale(1.04);
            filter: grayscale(100%) contrast(1.38) brightness(1.15) drop-shadow(0 0 18px rgba(255,255,255,0.22));
          }
        }
      `}</style>
      {currentHeroMedia.type === 'video' ? (
        <video
          key={currentHeroMedia.src}
          src={currentHeroMedia.src}
          poster={currentHeroMedia.poster}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration;
            if (duration && Number.isFinite(duration)) {
              onSlideDurationChange(Math.max(defaultSlideDurationMs, Math.round(duration * 1000)));
            }
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-50 [filter:grayscale(100%)_contrast(110%)_brightness(1.15)]"
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{
            backgroundImage: `url(${currentHeroMedia.src})`,
            backgroundSize: 'cover',
            backgroundPosition: currentHeroMedia.position,
            filter: 'grayscale(100%) contrast(110%) brightness(1.15)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.6),rgba(0,0,0,0.9))]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-end gap-8 px-6 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <div className="group relative mb-6 w-full max-w-[420px] md:-ml-8 lg:-ml-12">
            <div className="pointer-events-none absolute inset-[-8%] rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_62%)] opacity-70 blur-2xl animate-[logoGlowPulse_6s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute inset-y-0 left-[-18%] w-[36%] -skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 blur-md animate-[logoLightSweep_7.5s_ease-in-out_infinite]" />
            <div className="relative animate-[logoFloat_13.5s_ease-in-out_infinite]">
              <img
                src={heroLogoWhite}
                alt={brand.logoAlt}
                decoding="async"
                className="relative h-auto w-full object-contain opacity-95 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphWhite_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoYellow}
                alt=""
                aria-hidden="true"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-auto w-full object-contain opacity-0 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphYellow_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoBlack}
                alt=""
                aria-hidden="true"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-auto w-full object-contain opacity-0 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphBlack_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoWhite}
                alt=""
                aria-hidden="true"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-auto w-full object-contain opacity-0 mix-blend-screen animate-[logoGlitch_11s_steps(1,end)_infinite]"
              />
            </div>
          </div>
          <p className="mb-4 inline-block rounded-full px-2 py-1 text-xs uppercase tracking-[0.35em] text-white/60 transition duration-300 hover:bg-[radial-gradient(circle_at_center,rgba(255,214,10,0.22),transparent_72%)] hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,10,0.22)]">Debut single releases Friday June 12, 2026</p>
          <h1 className="max-w-6xl text-5xl font-black uppercase leading-none transition duration-300 hover:drop-shadow-[0_0_26px_rgba(255,214,10,0.18)] md:text-7xl lg:text-8xl">
            <span className="block text-white/92">Debut single launch</span>
            <span className="relative mt-2 block text-white/55 md:mt-3">
              <span className="pointer-events-none absolute inset-x-[18%] inset-y-[18%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,214,10,0.42),rgba(255,214,10,0.12)_44%,transparent_78%)] blur-xl animate-[sectionTitleGlow_4.5s_ease-in-out_infinite]" />
              <span className="inline-block drop-shadow-[0_0_14px_rgba(255,214,10,0.22)] animate-[liveHeadlinePulse_4.2s_ease-in-out_infinite]">Live at</span>
            </span>
            <span className="mt-2 block text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.16)] md:mt-3">
              Starfish Sessions.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl rounded-2xl px-3 py-2 text-base text-white/70 transition duration-300 hover:bg-[radial-gradient(circle_at_center,rgba(255,214,10,0.16),transparent_78%)] hover:text-white/86 hover:drop-shadow-[0_0_16px_rgba(255,214,10,0.16)] md:text-lg">Exit Smiling launch their debut single on Friday, June 12, 2026 at Starfish Sessions (Upstairs) inside The Starfish Deli, Batemans Bay.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="https://www.starfishwaterfront.com/stafishsessions" target="_blank" rel="noreferrer" className="rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:scale-[1.02]">Launch Event</a>
            <a href="https://humanitix.com/au/search/au--batemans-bay--2536/starfish%20sessions?dates=all" target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white">Tickets</a>
          </div>
          <HeroQuickActions />
        </div>
        <div className="relative grid gap-4 self-end">
          {showHeroManifestoTile ? (
            <div className="pointer-events-none absolute inset-x-6 bottom-[calc(100%+0.65rem)] z-20">
              <BandHeadingFigures />
            </div>
          ) : null}
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {showHeroManifestoTile ? "Why Exit Smiling?" : "Featured release"}
            </p>
            {showHeroManifestoTile ? (
              <div className="relative mt-4 flex aspect-square w-full flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-yellow-100/18 bg-[#11100b] p-5 shadow-[inset_0_0_40px_rgba(250,204,21,0.05)] animate-[fadeIn_0.55s_ease_forwards]">
                <div className="pointer-events-none absolute inset-0 opacity-55 bg-[radial-gradient(circle_at_15%_10%,rgba(250,204,21,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%),repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0px,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_18px)]" />
                <img
                  src="https://exit-smiling-media.bennoclark.workers.dev/manifesto/catch-22-origin-image.png"
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  className="pointer-events-none absolute right-[-12%] top-[10%] w-[78%] max-w-[24rem] mix-blend-screen"
                  style={{
                    animation: 'heroCatch22ImagePulse 8.4s ease-in-out infinite',
                  }}
                />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-yellow-100/70">
                    Deeper than just a smile
                  </p>
                  <h2 className="mt-2 max-w-[13rem] -rotate-2 text-3xl font-black uppercase leading-[0.92] text-white drop-shadow-[0_0_18px_rgba(250,204,21,0.12)] md:text-4xl">
                    No forced smiles.
                  </h2>
                </div>
                <div className="relative space-y-2.5 text-[13px] leading-5 text-white/74 md:text-sm md:leading-[1.45rem]">
                  <p>
                    Max&apos;s avid reading inspired the name Exit Smiling. He uncovered the paradox at the heart of Catch-22: trapped by rules that contradict themselves where even our escape depends on playing along with the system. Perhaps you can relate?
                  </p>
                  <p className="font-black uppercase tracking-[0.12em] text-yellow-50">
                    Smile. Agree. Move on.
                  </p>
                  <p>
                    While that might work for our world systems, it won&apos;t work for us. As a band, we have no filters, no fake exits. Just our creativity and noise telling the truth.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenHeroSingleImage?.()}
                className="group relative mt-4 block w-full aspect-square overflow-hidden rounded-2xl border border-white/10 bg-transparent p-0 text-left animate-[fadeIn_0.55s_ease_forwards]"
              >
                <div
                  className="absolute inset-0 transition duration-500 ease-out group-hover:scale-[1.02] filter contrast-110 brightness-105 sepia-[0.18] saturate-[1.15] hue-rotate-[338deg] group-hover:grayscale group-hover:sepia-0 group-hover:saturate-0 group-hover:brightness-110"
                  style={{
                    backgroundImage: `url(${exitSmilingDebutSingleCover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 70%',
                  }}
                />
                <div className="absolute inset-0 bg-black/20 transition duration-500 group-hover:opacity-0" />
                <div className="pointer-events-none absolute inset-[-12%] flex items-center justify-center">
                  <div
                    className="-rotate-[24deg] rounded-2xl border border-white/18 bg-black/45 px-4 py-3 shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-sm"
                    style={{ animation: 'heroReleaseOverlayPulse 4.8s ease-in-out infinite' }}
                  >
                    <p className="max-w-[11rem] text-center text-sm font-black uppercase leading-tight tracking-[0.12em] text-white md:max-w-[13rem] md:text-lg">
                      PREVIEW ONLY - RELEASING ON APPLE MUSIC 6/12/26
                    </p>
                  </div>
                </div>
              </button>
            )}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold uppercase">
                  {showHeroManifestoTile ? "Band Manifesto" : "Debut Single"}
                </h2>
                <p className="text-sm text-white/60">
                  {showHeroManifestoTile ? "The name behind the noise" : "Releases live on Friday June 12, 2026"}
                </p>
              </div>
              {showHeroManifestoTile ? (
                <button
                  type="button"
                  onClick={() => setShowHeroManifestoTile(false)}
                  className="rounded-full border border-white px-4 py-2 text-right text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
                >
                  View single
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onOpenReleasePreview({
                      src: "https://exit-smiling-media.bennoclark.workers.dev/releases/exit-smiling-single-teaser.mp4",
                      disclaimer: "LIVE PREVIEW OF 'EXIT SMILING' by EXIT SMILING - OFFICIAL MASTERED SINGLE COMING SOON",
                    })
                  }
                  className="rounded-full border border-white px-4 py-2 text-right text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
                >
                  Listen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Releases({ onOpenReleasePreview }) {
  return (
    <section id="music" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <style>{`
        @keyframes heroReleaseOverlayPulse {
          0%, 18%, 82%, 100% {
            opacity: 0.76;
            transform: rotate(-24deg) scale(0.94);
          }
          26%, 74% {
            opacity: 0;
            transform: rotate(-24deg) scale(0.9);
          }
        }
      `}</style>
      <div className="mb-10">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle>Latest releases</SectionTitle>
          <a href="#" className="text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white">View all</a>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {releases.map((item) => {
          const parts = item.title.split(' - ');
          const hasSplit = parts.length > 1;
          const label = hasSplit ? parts[0] : null;
          const name = hasSplit ? parts.slice(1).join(' - ') : item.title;
          return (
            <article
              key={item.title}
              className={`group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] ${item.previewVideo ? 'cursor-pointer' : ''}`}
              onClick={item.previewVideo ? () => onOpenReleasePreview(item.previewVideo) : undefined}
            >
              <div className="mb-3 h-5">{label && <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">{label}</p>}</div>
              <div
                className={`overflow-hidden rounded-2xl border border-white/10 bg-black ${item.previewVideo ? 'cursor-pointer' : ''}`}
                onClick={item.previewVideo ? () => onOpenReleasePreview(item.previewVideo) : undefined}
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover scale-[1.03] transition duration-500 ease-out filter contrast-110 brightness-105 group-hover:grayscale group-hover:brightness-95 group-hover:scale-[1.06]"
                  />
                  {item.overlayText ? (
                    <div className="pointer-events-none absolute inset-[-12%] flex items-center justify-center">
                      <div
                        className="-rotate-[24deg] rounded-2xl border border-white/18 bg-black/45 px-4 py-3 shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-sm"
                        style={{ animation: 'heroReleaseOverlayPulse 4.8s ease-in-out infinite' }}
                      >
                        <p className="max-w-[11rem] text-center text-sm font-black uppercase leading-tight tracking-[0.12em] text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.6)] md:max-w-[13rem] md:text-lg">
                          {item.overlayText}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <h3 className="mt-4 text-xl font-bold uppercase md:text-2xl">{name}</h3>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/50">{item.meta}</p>
              <p className="mt-3 flex-1 text-sm leading-6 text-white/65">{item.blurb}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.previewVideo) onOpenReleasePreview(item.previewVideo);
                }}
                disabled={!item.previewVideo}
                className={`mt-4 self-end rounded-full border px-4 py-2 text-right text-xs uppercase tracking-[0.2em] transition ${
                  item.previewVideo
                    ? "border-white text-white hover:bg-white hover:text-black"
                    : "cursor-not-allowed border-white/15 text-white/35"
                }`}
              >
                {item.previewVideo ? "Click for a teaser" : "Soon"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Gigs() {
  const [isHoveringPastGigs, setIsHoveringPastGigs] = useState(false);
  const [activePastGigPosterIndex, setActivePastGigPosterIndex] = useState(0);
  const [activeGigPosterKey, setActiveGigPosterKey] = useState(null);
  const [selectedGigPoster, setSelectedGigPoster] = useState(null);
  const posterSegmentDuration = 3.0;

  useEffect(() => {
    if (!isHoveringPastGigs) {
      setActivePastGigPosterIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActivePastGigPosterIndex((prev) => (prev + 1) % pastGigPosterImages.length);
    }, posterSegmentDuration * 1000);

    return () => window.clearInterval(interval);
  }, [isHoveringPastGigs, posterSegmentDuration]);

  const handlePastGigsEnter = () => {
    setIsHoveringPastGigs(true);
  };

  const handlePastGigsLeave = () => {
    setIsHoveringPastGigs(false);
  };

  useEffect(() => {
    if (!selectedGigPoster) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setSelectedGigPoster(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedGigPoster]);

  return (
    <section id="tour" className="scroll-mt-32 border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <SectionTitle>Gigs</SectionTitle>
          <div
            className="group/pastgigs relative"
            onMouseEnter={handlePastGigsEnter}
            onMouseLeave={handlePastGigsLeave}
          >
            <button
              type="button"
              className="inline-flex rounded-full border border-white/18 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
            >
              Past Gigs
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-20 pt-4 opacity-0 transition duration-300 translate-y-2 group-hover/pastgigs:translate-y-0 group-hover/pastgigs:opacity-100">
              <div className="relative w-[min(320px,72vw)] overflow-hidden rounded-3xl border border-white/12 bg-black/90 shadow-[0_0_34px_rgba(255,255,255,0.12)]">
                <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-yellow-300/35 bg-yellow-300/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.24)] backdrop-blur-sm">
                  Past Gigs
                </div>
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/65 via-black/18 to-black/18" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_68%)]" />
                <div className="aspect-[3/4]">
                  {pastGigPosterImages.map((image, index) => (
                    <img
                      key={`past-gig-poster-${index}`}
                      src={image}
                      alt={`Past gig poster ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className={`absolute inset-0 h-full w-full object-cover transition duration-500 ease-out ${
                        isHoveringPastGigs && index === activePastGigPosterIndex ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 pt-12">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Hover preview</p>
                  <p className="mt-1 text-sm font-semibold uppercase text-white">Gig Poster Archive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 divide-y divide-white/10 rounded-3xl border border-white/10">
          {tourDates.map((show, index) => {
            const trimmedHref = typeof show.href === "string" ? show.href.trim() : "";
            const hasTickets = trimmedHref.startsWith("http");
            const showKey = `${show.date}-${show.city}`;
            const isPosterActive = activeGigPosterKey === showKey;

            return (
            <div
              key={showKey}
              className={`group relative grid gap-4 px-5 py-5 transition duration-300 ease-out hover:z-10 hover:scale-[1.015] hover:bg-white/[0.08] hover:shadow-[0_0_36px_rgba(255,255,255,0.14)] md:grid-cols-[160px_1fr_auto] md:items-center ${index === 0 ? 'bg-white/5' : ''}`}
              onMouseEnter={() => setActiveGigPosterKey(show.posterImage ? showKey : null)}
              onMouseLeave={() => setActiveGigPosterKey((current) => (current === showKey ? null : current))}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent opacity-0 transition duration-300 group-hover:border-white/30 group-hover:opacity-100" />
              {show.posterImage ? (
                index < 3 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedGigPoster({ src: show.posterImage, title: `${show.city} gig poster` })}
                    onMouseEnter={() => setActiveGigPosterKey(showKey)}
                    onMouseLeave={() => setActiveGigPosterKey((current) => (current === showKey ? null : current))}
                    className={`absolute right-[20%] top-1/2 z-20 hidden w-[min(240px,24vw)] -translate-y-1/2 transition duration-300 xl:block ${isPosterActive ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"}`}
                  >
                    <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/90 shadow-[0_0_34px_rgba(255,255,255,0.14)]">
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
                      <img
                        src={show.posterImage}
                        alt={`${show.city} gig poster`}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[3/4] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                      />
                    </div>
                  </button>
                ) : (
                  <div
                    onMouseEnter={() => setActiveGigPosterKey(showKey)}
                    onMouseLeave={() => setActiveGigPosterKey((current) => (current === showKey ? null : current))}
                    className={`absolute right-[20%] top-1/2 z-20 hidden w-[min(240px,24vw)] -translate-y-1/2 transition duration-300 xl:block ${isPosterActive ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"}`}
                  >
                    <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/90 shadow-[0_0_34px_rgba(255,255,255,0.14)]">
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
                      <img
                        src={show.posterImage}
                        alt={`${show.city} gig poster`}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[3/4] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                      />
                    </div>
                  </div>
                )
              ) : null}
              <div className="text-xl font-bold uppercase tracking-[0.2em] transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]">{show.date}</div>
              <div>
                <div className="text-lg font-semibold uppercase transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.18)]">{show.city}</div>
                <div className="text-sm text-white/60 transition duration-300 group-hover:text-white/80">{show.venue}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45 transition duration-300 group-hover:text-white/65">{show.time} - {show.note}</div>
                <div className="mt-3 flex max-h-0 items-center gap-2 overflow-hidden text-[10px] uppercase tracking-[0.24em] text-white/60 opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-white/25 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span className="text-white/72">{show.mapHref ? 'Venue map available' : 'Venue highlighted'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3 md:min-w-[210px]">
                {show.mapHref ? (
                  <a
                    href={show.mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/72 transition duration-300 group-hover:border-white/35 group-hover:bg-white/10 group-hover:text-white"
                  >
                    Map
                  </a>
                ) : null}
                <a href={trimmedHref || '#'} target={hasTickets ? '_blank' : undefined} rel={hasTickets ? 'noreferrer' : undefined} className="ml-auto rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black hover:border-white hover:bg-white hover:text-black">
                  {hasTickets ? 'Tickets' : 'Soon'}
                </a>
              </div>
            </div>
          )})}
        </div>
        {selectedGigPoster ? (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedGigPoster(null)}
          >
            <div className="max-h-[86vh] w-full max-w-5xl">
              <img
                src={selectedGigPoster.src}
                alt={selectedGigPoster.title}
                decoding="async"
                className="max-h-[86vh] w-full rounded-3xl object-contain shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedContent({ onOpenVideo, onOpenAudioImage, onOpenReleasePreview }) {
  return (
    <section id="videos" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <SectionTitle>Featured content</SectionTitle>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {videos.map((video, i) => (
          <article key={video.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_34px_rgba(255,255,255,0.1)]">
            {i === 0 ? (
              <div
                className="relative cursor-pointer overflow-hidden"
                onClick={() =>
                  onOpenReleasePreview({
                    src: "https://exit-smiling-media.bennoclark.workers.dev/releases/exit-smiling-single-teaser.mp4",
                    disclaimer: "LIVE PREVIEW OF 'EXIT SMILING' by EXIT SMILING - OFFICIAL MASTERED SINGLE COMING SOON",
                  })
                }
              >
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video bg-cover bg-center transition duration-500 ease-out group-hover:scale-[1.05] group-hover:brightness-110" style={{ backgroundImage: `url(${exitSmilingDebutSingleCover})` }} />
                <div className="pointer-events-none absolute inset-[-18%] z-20 flex items-center justify-center">
                  <div className="-rotate-[24deg] rounded-2xl border border-white/18 bg-black/45 px-4 py-2.5 shadow-[0_0_24px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                    <p className="max-w-[10rem] text-center text-xs font-black uppercase leading-tight tracking-[0.12em] text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.6)] md:max-w-[12rem] md:text-base">
                      PREVIEW ONLY - RELEASING ON APPLE MUSIC 6/12/26
                    </p>
                  </div>
                </div>
              </div>
            ) : i === 1 ? (
              <div className="relative cursor-pointer overflow-hidden" onClick={onOpenVideo}>
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video w-full bg-cover bg-center transition duration-500 ease-out group-hover:scale-[1.05] group-hover:brightness-110" style={{ backgroundImage: "url('https://img.youtube.com/vi/nlqhNT8FOuk/maxresdefault.jpg')" }} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition duration-300 group-hover:bg-black/15">
                  <div className="absolute bottom-4 left-4 text-left">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70 transition duration-300 group-hover:text-white/85">Live</p>
                    <h4 className="text-lg font-bold uppercase transition duration-300 group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.22)]">Bombtrack (RATM Cover)</h4>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white bg-black/30 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-white/10 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.22)]">
                    <div className="ml-1 border-l-[10px] border-l-white border-y-[6px] border-y-transparent transition-transform duration-300 ease-out group-hover:translate-x-[1px]" />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="relative cursor-pointer overflow-hidden"
                onClick={() =>
                  onOpenAudioImage({
                    image: "https://exit-smiling-media.bennoclark.workers.dev/press/abc-radio-studio.jpg",
                    title: "ABC Radio Live Show",
                    youtubeId: "FhFmBOPrCkw",
                    youtubeTitle: "ABC Radio Live Show with Alice Ansara",
                  })
                }
              >
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video bg-cover bg-center transition duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-110" style={{ backgroundImage: "url('https://exit-smiling-media.bennoclark.workers.dev/press/abc-radio-studio.jpg')" }} />
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
                  <div className="text-white drop-shadow-[0_0_18px_rgba(0,0,0,0.7)]">
                    <p className="text-xl font-normal uppercase tracking-[0.22em] md:text-2xl">LIVE WITH</p>
                    <p className="mt-1 text-2xl font-black uppercase tracking-[0.08em] md:text-3xl">ALICE ANSARA</p>
                  </div>
                </div>
              </div>
            )}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50 transition duration-300 group-hover:text-white/65">{video.label}</p>
              <h3 className="mt-2 text-2xl font-bold uppercase transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.18)]">{video.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Store({
  products,
  productsLoading,
  productsError,
  onAddToCart,
  onOpenMerchImage,
  selectedOptionsByProduct,
  setSelectedOptionsByProduct,
}) {
  const merchPreviewVideoRef = useRef(null);
  const [merchPreviewAspectRatio, setMerchPreviewAspectRatio] = useState(null);
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

  const normalizeOptionKey = (value) =>
    String(value || "").trim().toLowerCase();

  const normalizeOptionValue = (value) =>
    String(value || "").trim().toLowerCase();

  const topProduct = products?.[0] || null;
  const topProductImageOverride =
    topProduct &&
    (mostPopularProductImageOverrides[String(topProduct.id || "").trim().toLowerCase()] ||
      mostPopularProductImageOverrides[String(topProduct.handle || "").trim().toLowerCase()] ||
      mostPopularProductImageOverrides[String(topProduct.title || "").trim().toLowerCase()]);
  const topProductImage =
    topProductImageOverride ||
    topProduct?.thumbnail ||
    topProduct?.images?.[0]?.url ||
    fallbackMerchImage;

  const handleMerchPreviewEnter = async () => {
    const video = merchPreviewVideoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
      video.muted = false;
      video.volume = 1;
      await video.play();
    } catch {
      video.muted = true;
      await video.play().catch(() => {});
    }
  };

  const handleMerchPreviewLeave = () => {
    const video = merchPreviewVideoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    video.muted = true;
    video.volume = 1;
  };

  const handleMerchPreviewMetadataLoaded = () => {
    const video = merchPreviewVideoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return;

    setMerchPreviewAspectRatio(video.videoWidth / video.videoHeight);
  };

  const renderProductTitle = (title) => {
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
  };

  const getVariantOptionMap = (variant) => {
    const map = {};

    variant?.options?.forEach((opt) => {
      const optionName = normalizeOptionKey(opt.option?.title || opt.option?.name);
      const optionValue = normalizeOptionValue(opt.value);

      if (optionName) {
        map[optionName] = optionValue;
      }
    });

    return map;
  };

  const findMatchingVariant = (product, selectedOptions) => {
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
      requiredOptionNames.length > 0 &&
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
  };

  const getVariantStockInfo = (variant) => {
    if (!variant) return null;

    const inventoryQuantityCandidates = [
      variant.inventory_quantity,
      variant.stocked_quantity,
      variant.available_quantity,
    ];

    const rawQuantity = inventoryQuantityCandidates.find(
      (value) => value != null && !Number.isNaN(Number(value))
    );

    const quantity = rawQuantity == null ? null : Number(rawQuantity);
    const allowBackorder = Boolean(variant.allow_backorder);
    const manageInventory =
      variant.manage_inventory == null ? true : Boolean(variant.manage_inventory);

    if (!manageInventory) {
      return {
        toneClassName: "text-white/45",
        message: "Stock not tracked for this item",
      };
    }

    if (quantity == null) {
      return allowBackorder
        ? {
            toneClassName: "text-amber-300",
            message: "Custom made - allow 7 extra days",
          }
        : {
            toneClassName: "text-white/45",
            message: "Stock level unavailable",
          };
    }

    if (quantity > 0) {
      return {
        toneClassName: "text-emerald-300",
        message: `${quantity} in stock`,
      };
    }

    if (allowBackorder) {
      return {
        toneClassName: "text-amber-300",
        message: "0 in stock - custom made - allow 7 extra days",
      };
    }

    return {
      toneClassName: "text-rose-300",
      message: "Out of stock",
    };
  };

  const renderSizeGuide = (guideType) => {
    const guide = sizeGuides[guideType];

    if (!guide) return null;

    return (
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
          {guide.title}
        </p>
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
                <tr key={`${guideType}-${rowIndex}`} className="border-b border-white/5 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${guideType}-${rowIndex}-${cellIndex}`} className="px-2 py-2">
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
        <p className="mt-2 text-[10px] text-white/35">
          Sizing is based on body measurements, not garment measurements. All measurements are approximate and may vary slightly between garment styles.
        </p>
      </div>
    );
  };

  return (
    <section id="store" className="scroll-mt-32 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-start justify-between gap-8">
          <div className="max-w-3xl">
            <SectionTitle>Merch</SectionTitle>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">
              All our band merch is currently lovingly hand screenprinted by the band to save waste, and all proceeds go toward our Japan Tour. We print in small on-demand batches and occasional one-offs. We print once weekly, so if your choice is not currently in inventory we will let you know the approximate print time.
            </p>
            <div className="mt-5 grid gap-3 text-xs text-white/64 sm:grid-cols-3">
              {[
                ["Secure checkout", "Card, Apple Pay, and Google Pay via Stripe."],
                ["Ships from Australia", "Standard and Express options at checkout."],
                ["Print-on-demand", "Out-of-stock items add about 7 days before shipping."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="font-black uppercase tracking-[0.18em] text-white/82">{title}</p>
                  <p className="mt-2 leading-5">{copy}</p>
                </div>
              ))}
            </div>
            <div
              className="group/merchvideo relative mt-5 inline-block"
              onMouseEnter={handleMerchPreviewEnter}
              onMouseLeave={handleMerchPreviewLeave}
            >
              <a
                href="https://exit-smiling-media.bennoclark.workers.dev/videos/socials-professional-impact.mp4"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/18 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
              >
                Behind the Scenes: Handmade Merch
              </a>
              <div className="pointer-events-none absolute left-0 top-full z-20 pt-4 opacity-0 transition duration-300 translate-y-2 group-hover/merchvideo:pointer-events-auto group-hover/merchvideo:translate-y-0 group-hover/merchvideo:opacity-100">
                <video
                  ref={merchPreviewVideoRef}
                  src="https://exit-smiling-media.bennoclark.workers.dev/videos/socials-professional-impact.mp4"
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleMerchPreviewMetadataLoaded}
                  className="max-h-[70vh] max-w-[min(420px,80vw)] rounded-2xl border border-white/12 bg-black/95 object-contain shadow-[0_0_30px_rgba(255,255,255,0.12)]"
                  style={{ aspectRatio: merchPreviewAspectRatio || undefined }}
                />
              </div>
            </div>
          </div>
          <div className="relative hidden self-start md:block">
            <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_62%)]" />
            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/8 bg-black/30 p-2 shadow-[0_0_34px_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => topProduct && onOpenMerchImage?.(topProductImage, topProduct.title)}
                className="group/popular relative block overflow-hidden rounded-[1.2rem] text-left"
                disabled={!topProduct}
              >
                <img
                  src={topProductImage}
                  alt={topProduct ? `${topProduct.title} - most popular merch` : "Most popular merch"}
                  loading="lazy"
                  decoding="async"
                  className="block h-[280px] w-[160px] object-cover object-center transition duration-500 ease-out [filter:contrast(1.08)_brightness(1.02)] group-hover/popular:scale-[1.06] group-hover/popular:brightness-110"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20">
                  <div className="rounded-full border border-yellow-300/30 bg-black/55 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.2)] backdrop-blur-sm animate-[liveHeadlinePulse_5.2s_ease-in-out_infinite]">
                    Most Popular
                  </div>
                  {topProduct ? (
                    <div className="mt-3 rounded-2xl border border-white/12 bg-black/60 px-3 py-2 text-center backdrop-blur-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
                        {topProduct.title}
                      </p>
                      {Number(topProduct.units_sold || 0) > 0 ? (
                        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/50">
                          {topProduct.units_sold} sold to date
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {productsLoading && products?.length === 0 && (
            <p className="text-white/50">Loading merch...</p>
          )}

          {!productsLoading && productsError && products?.length === 0 && (
            <div className="rounded-3xl border border-red-400/25 bg-red-950/25 p-5 text-sm text-red-100">
              <p className="font-semibold uppercase tracking-[0.18em] text-red-200">
                Merch could not load
              </p>
              <p className="mt-2 text-red-100/80">{productsError}</p>
            </div>
          )}

          {products?.map((product) => {
            const selectedOptions = selectedOptionsByProduct[product.id] || {};
            const selectedVariant = findMatchingVariant(product, selectedOptions);

            const amount =
              selectedVariant?.calculated_price?.calculated_amount ??
              selectedVariant?.calculated_price?.original_amount ??
              selectedVariant?.prices?.[0]?.amount ??
              null;

            const price =
              amount == null || Number.isNaN(Number(amount))
                ? null
                : `$${Number(amount).toFixed(2)}`;
            const hasSelectedTypeAndSize =
              Boolean(normalizeOptionValue(selectedOptions["type"])) &&
              Boolean(normalizeOptionValue(selectedOptions["size"]));
            const stockInfo =
              hasSelectedTypeAndSize && selectedVariant
                ? getVariantStockInfo(selectedVariant)
                : null;
            const sizeGuideType = detectSizeGuideType(product, selectedOptions);
            const isMadeToOrder =
              Boolean(selectedVariant?.allow_backorder) &&
              stockInfo?.message?.toLowerCase().includes("custom made");

            const image =
              product.thumbnail ||
              product.images?.[0]?.url ||
              fallbackMerchImage;

            return (
              <article
                key={product.id}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_34px_rgba(255,255,255,0.08)]"
              >
                <button
                  type="button"
                  onClick={() => onOpenMerchImage?.(image, product.title)}
                  className="group/image relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black text-left transition duration-300 ease-out hover:border-white/25 hover:shadow-[0_0_32px_rgba(255,255,255,0.12)]"
                >
                  <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover/image:opacity-100" />
                  <div className="flex min-h-[320px] items-center justify-center p-3 md:min-h-[380px]">
                    <img
                      src={image}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[520px] w-full cursor-pointer object-contain transition duration-500 ease-out group-hover/image:scale-[1.055] group-hover/image:brightness-110"
                      onClick={() => onOpenMerchImage?.(image, product.title)}
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/45 via-transparent to-black/10 opacity-0 transition duration-300 group-hover/image:opacity-100">
                    <div className="rounded-full border border-white/40 bg-black/65 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(255,255,255,0.16)] backdrop-blur-sm">
                      View larger
                    </div>
                  </div>
                </button>

                <h3 className="mt-3 text-center text-lg font-semibold uppercase">
                  {renderProductTitle(product.title)}
                </h3>

                {(() => {
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

                  const selectedType = selectedOptions["type"] || "";

                  const availableSizesForSelectedType = Array.from(
                    new Set(
                      (product.variants || [])
                        .filter((variant) => {
                          const variantOptionMap = getVariantOptionMap(variant);

                          if (!selectedType) return true;
                          return variantOptionMap["type"] === normalizeOptionValue(selectedType);
                        })
                        .map((variant) => {
                          const variantOptionMap = getVariantOptionMap(variant);
                          return variantOptionMap["size"];
                        })
                        .filter(Boolean)
                    )
                  );

                  const renderOptionButtons = (option, filteredValues = null) => {
                    const optionName = normalizeOptionKey(option.title || option.name);
                    const optionLabel = option.title || option.name;
                    const rawValues = option.values || [];

                    const values = filteredValues
                      ? rawValues.filter((valueObj) =>
                        filteredValues.includes(normalizeOptionValue(valueObj.value))
                      )
                      : rawValues;

                    if (!values.length) return null;

                    return (
                      <div key={option.id} className="mt-3">
                        <p className="mb-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/45">
                          {optionLabel}
                        </p>

                        <div className="flex flex-wrap justify-center gap-2">
                          {values.map((valueObj) => {
                            const value = valueObj.value;
                            const isActive =
                              normalizeOptionValue(selectedOptions[optionName]) ===
                              normalizeOptionValue(value);
                            const sizePreviewVariant =
                              optionName === "size" && selectedType
                                ? (product.variants || []).find((variant) => {
                                    const variantOptionMap = getVariantOptionMap(variant);
                                    if (
                                      variantOptionMap["type"] !== normalizeOptionValue(selectedType) ||
                                      variantOptionMap["size"] !== normalizeOptionValue(value)
                                    ) {
                                      return false;
                                    }

                                    return Object.entries(selectedOptions || {}).every(([selectedKey, selectedValue]) => {
                                      const normalizedKey = normalizeOptionKey(selectedKey);
                                      const normalizedValue = normalizeOptionValue(selectedValue);

                                      if (!normalizedValue || normalizedKey === "size") return true;
                                      return variantOptionMap[normalizedKey] === normalizedValue;
                                    });
                                  })
                                : null;
                            const sizePreviewStockInfo =
                              optionName === "size" && selectedType
                                ? getVariantStockInfo(sizePreviewVariant)
                                : null;

                            return (
                              <button
                                key={valueObj.id}
                                type="button"
                                onClick={() =>
                                  setSelectedOptionsByProduct((prev) => {
                                    const next = {
                                      ...prev,
                                      [product.id]: {
                                        ...(prev[product.id] || {}),
                                        [optionName]: value,
                                      },
                                    };

                                    // when type changes, clear size if it's no longer valid
                                    if (optionName === "type") {
                                      const nextType = normalizeOptionValue(value);

                                      const validSizes = Array.from(
                                        new Set(
                                          (product.variants || [])
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

                                      const currentSize = normalizeOptionValue(
                                        next[product.id]?.["size"]
                                      );

                                      if (currentSize && !validSizes.includes(currentSize)) {
                                        next[product.id]["size"] = "";
                                      }
                                    }

                                    return next;
                                  })
                                }
                                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.15em] transition ${isActive
                                    ? "border-white bg-zinc-600 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                                    : "border-white/10 bg-zinc-800 text-white/70 hover:bg-zinc-700 hover:text-white"
                                  }`}
                              >
                                <span className="block">{value}</span>
                                {sizePreviewStockInfo ? (
                                  <span
                                    className={`mt-1 block text-[9px] font-medium normal-case tracking-normal ${sizePreviewStockInfo.toneClassName}`}
                                  >
                                    {sizePreviewStockInfo.message}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {typeOption ? renderOptionButtons(typeOption) : null}
                      {sizeOption
                        ? renderOptionButtons(sizeOption, availableSizesForSelectedType)
                        : null}
                      {otherOptions.map((option) => renderOptionButtons(option))}
                    </>
                  );
                })()}

                {sizeGuideType ? (
                  <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <summary className="cursor-pointer list-none text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                      Size Guide +
                    </summary>
                    <div className="mt-3 text-left">
                      <p className="text-xs text-white/55">
                        Check your size before ordering. These guides apply to our T-shirts and hoodies.
                      </p>
                      {renderSizeGuide(sizeGuideType)}
                    </div>
                  </details>
                ) : null}

                {price ? (
                  <p className="mt-3 text-center text-sm text-white/60">{price}</p>
                ) : (
                  <p className="mt-3 text-center text-sm text-white/35">
                    Select Type and Size to see price
                  </p>
                )}

                {stockInfo ? (
                  <p className={`mt-2 text-center text-xs uppercase tracking-[0.16em] ${stockInfo.toneClassName}`}>
                    {stockInfo.message}
                  </p>
                ) : null}

                <button
                  onClick={() => onAddToCart(product.id)}
                  className="mt-4 w-full rounded-full border border-white/10 bg-zinc-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-zinc-700"
                >
                  {isMadeToOrder ? "Add to Cart - Item will be made to order" : "Add to Cart"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ member }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFlashback, setSelectedFlashback] = useState(null);
  const [selectedBioClip, setSelectedBioClip] = useState(null);
  const [hoverGalleryOpen, setHoverGalleryOpen] = useState(false);
  const [isHoveringBioImage, setIsHoveringBioImage] = useState(false);
  const [activeHoverImageIndex, setActiveHoverImageIndex] = useState(0);
  const [activeHoverGalleryIndex, setActiveHoverGalleryIndex] = useState(0);
  const imageClassName =
    "aspect-square w-full rounded-2xl border border-white/10 transition duration-500 ease-out group-hover:scale-[1.045] group-hover:brightness-110";
  const lighterSideImages =
    member.name === 'Max'
      ? [
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-live-bass.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-asleep.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-soccer-01.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-logo-shirt.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-ski.jpg',
            className: 'object-top',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-team-lab.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fishing-01.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-soccer-02.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fishing-02.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-waterslide-poster.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fender-tokyo-poster.jpg',
            className: '',
          },
          {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-jamberoo-poster.jpg',
            className: '',
          },
          ]
      : member.name === 'Joey'
        ? [
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-guitar-main.jpg',
              className: 'object-top',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-helmet.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-pilot-training.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-fender-tokyo.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-snow-grooming-poster.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-timber-sledding-poster.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-wakesurfing-poster.jpg',
              className: '',
            },
          ]
      : member.name === 'Lando'
        ? [
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-guitar-main.jpg',
              className: 'object-top',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-crowd-cohen-maberly.jpg',
              className: '',
              credit: 'Photo: Cohen Maberly',
            },
          ]
      : member.name === 'Cadence'
        ? [
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-main.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-crowd-cohen-maberly.jpg',
              className: '',
              credit: 'Photo: Cohen Maberly',
            },
          ]
      : member.name === 'Julian'
        ? [
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-main.jpg',
              className: '',
            },
            {
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-rotation-colour.jpg',
              className: '',
            },
          ]
      : null;
  const visibleLighterSideImages = useMemo(() => lighterSideImages || [], [member.name]);
  const hoverImageSegmentDuration = 2.1;
  const liveVideoRef = useRef(null);
  const bioClipVideoRef = useRef(null);
  const liveVideoFadeDuration = 0.6;
  const livePreview =
    member.name === 'Cadence'
      ? {
          src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-everlong-cover.mp4',
          label: 'Everlong Cover - Cadence on vocals',
        }
      : member.name === 'Joey'
        ? {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-lead-guitar-bombtrack.mp4',
            label: 'Joey on lead guitar',
            endAtSeconds: 26,
          }
      : member.name === 'Lando'
        ? {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-bombtrack-vocals.mp4',
            label: 'Lando on vocals',
          }
      : member.name === 'Julian'
        ? {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-closeup-drums.mp4',
            label: 'Julian on drums',
          }
      : member.name === 'Max'
        ? {
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-closeup-bass.mp4',
            label: 'Max on bass',
          }
      : null;
  const liveVideoSrc = livePreview?.src || null;
  const liveVideoTrimSeconds = Number(livePreview?.trimEndSeconds || 0);
  const liveVideoLabel = livePreview?.label || '';
  const liveClipVideo =
    liveVideoSrc
      ? {
          title: liveVideoLabel,
          src: liveVideoSrc,
          endAtSeconds: livePreview?.endAtSeconds,
        }
      : null;
  const memberAchievements =
    member.name === 'Joey'
      ? "Joey brings a wide mix of energy, discipline, and creativity to Exit Smiling. Outside the band, he has represented himself strongly across sport, leadership, and adventure. His background includes regional swimming, cross-country qualification, Nippers surf lifesaving, and serving as a school captain. He has been twin-tip skiing since he was two, was breakdancing at five, and is already part-way through his pilots licence training. That mix of movement, courage, focus, and creativity all feeds into the way he approaches guitar, performance, and life on stage."
      : member.name === 'Max'
        ? "Max brings a calm confidence and natural leadership to Exit Smiling. As the bands bass player, lyric writer, and oldest member, he helps anchor the group both musically and personally. His steady presence gives the younger members someone to look up to, while his songwriting and ideas help shape the bands sound and direction.\n\nAway from the stage, Max has always been active, curious, and quietly driven. He was school captain in Year 6, represented his school in cross country, and has played both club and representative soccer, often taking on the role of captain. He also loves mountain biking with his dad and has represented his school in MTB riding, bringing the same focus, balance, and determination to sport that he brings to music.\n\nMax learned to ski when he was 10 and has frothed on it ever since. He also learned to fish from his grandparents and still loves going out with them whenever he can. At different times he has been heavily into chess and tabletop gaming, although these days band life, school, sport, and bass practice do not leave much room for downtime.\n\nHe is also an avid reader and someone who thinks deeply about ideas, words, and stories - a quality that naturally feeds into his songwriting and lyrics. Whether he is locking in the groove on bass, helping shape a song, or offering quiet leadership behind the scenes, Max brings maturity, creativity, and a glimpse of the future for Exit Smiling."
      : null;
  const canShowPrivateMemberDetails =
    privateMemberDetailsEnabled && Boolean(memberAchievements);
  const detailVideos =
    member.name === 'Joey'
      ? [
          {
            type: 'video',
            title: 'Joey Snow Grooming',
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-snow-grooming.mp4',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-snow-grooming-poster.jpg',
          },
          {
            type: 'image',
            title: 'Pilot Training',
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-pilot-training.jpg',
          },
          {
            type: 'image',
            title: 'Fender Tokyo',
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-fender-tokyo.jpg',
          },
          {
            type: 'video',
            title: 'Joey Timber Sledding',
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-timber-sledding.mov',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-timber-sledding-poster.jpg',
          },
          {
            type: 'video',
            title: 'Joey Wakesurfing',
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-wakesurfing.mov',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-wakesurfing-poster.jpg',
            volume: 0.2,
          },
        ]
      : member.name === 'Max'
        ? [
            {
              type: 'video',
              title: 'Slip Sliding Away',
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-waterslide.mp4',
              poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-waterslide-poster.jpg',
            },
            {
              type: 'video',
              title: 'Tokyo Fender Shopping',
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fender-tokyo.mp4',
              poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-fender-tokyo-poster.jpg',
            },
            {
              type: 'video',
              title: 'Black Hole Surfing',
              src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-jamberoo-video.mp4',
              poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-jamberoo-poster.jpg',
            },
          ]
      : [];
  const bioClipVideo =
    member.name === 'Cadence'
      ? {
          title: null,
          src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-bio-video.mp4',
          poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-bio-video-poster.jpg',
        }
      : member.name === 'Joey'
      ? {
          title: null,
          src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-hendrix-video.mp4',
          poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-hendrix-video-poster.jpg',
        }
      : member.name === 'Julian'
        ? {
            title: null,
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-drums-video.mp4',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-drums-poster.jpg',
          }
      : member.name === 'Lando'
        ? {
            title: null,
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-vocals-video.mp4',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-vocals-poster.jpg',
          }
      : member.name === 'Max'
        ? {
            title: null,
            src: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-bass-video.mp4',
            poster: 'https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-bass-video-poster.jpg',
          }
      : null;

  const handleLiveVideoEnter = async () => {
    const video = liveVideoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
    } catch {
      video.muted = true;
      video.volume = 1;
    }
  };

  const handleLiveVideoLeave = () => {
    const video = liveVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 1;
  };

  const handleLiveVideoTimeUpdate = () => {
    const video = liveVideoRef.current;
    if (!video || video.muted || !video.duration) return;

    const loopEndTime = Math.max(0, video.duration - liveVideoTrimSeconds);
    const remaining = loopEndTime - video.currentTime;

    if (liveVideoTrimSeconds > 0 && video.currentTime >= loopEndTime) {
      video.currentTime = 0;
      video.volume = 1;
      return;
    }

    if (remaining <= liveVideoFadeDuration) {
      video.volume = Math.max(0, remaining / liveVideoFadeDuration);
      return;
    }

    video.volume = 1;
  };

  const handleBioImageEnter = () => {
    if (!visibleLighterSideImages?.length) return;

    setActiveHoverImageIndex(0);
    setIsHoveringBioImage(true);
  };

  const handleBioImageLeave = () => {
    setIsHoveringBioImage(false);
    setActiveHoverImageIndex(0);
  };
  const activeHoverImageCredit =
    isHoveringBioImage ? visibleLighterSideImages[activeHoverImageIndex]?.credit : null;
  const activeHoverGalleryCredit = visibleLighterSideImages[activeHoverGalleryIndex]?.credit;

  useEffect(() => {
    if (!isHoveringBioImage || visibleLighterSideImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHoverImageIndex((prev) => (prev + 1) % visibleLighterSideImages.length);
    }, hoverImageSegmentDuration * 1000);

    return () => window.clearInterval(interval);
  }, [isHoveringBioImage, visibleLighterSideImages.length, hoverImageSegmentDuration]);

  useEffect(() => {
    if (!hoverGalleryOpen || visibleLighterSideImages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveHoverGalleryIndex((prev) => (prev + 1) % visibleLighterSideImages.length);
    }, hoverImageSegmentDuration * 1000);

    return () => window.clearInterval(interval);
  }, [hoverGalleryOpen, visibleLighterSideImages.length, hoverImageSegmentDuration]);

  const handleBioClipEnter = async () => {
    const video = bioClipVideoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
    } catch {
      video.muted = true;
      video.volume = 1;
      await video.play().catch(() => {});
    }
  };

  const handleBioClipLeave = () => {
    const video = bioClipVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 1;
  };

  const handleBioClipTimeUpdate = () => {
    const video = bioClipVideoRef.current;
    const endAtSeconds = Number(bioClipVideo?.endAtSeconds || 0);
    if (!video || !endAtSeconds) return;

    if (video.currentTime >= endAtSeconds) {
      video.pause();
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const handleDetailVideoEnter = async (event) => {
    const video = event.currentTarget.querySelector("video");
    if (!video) return;

    const volume = Number(video.dataset.volume || 1);

    try {
      video.currentTime = 0;
      video.muted = false;
      video.volume = volume;
      await video.play();
    } catch {
      video.muted = true;
      video.volume = volume;
    }
  };

  const handleDetailVideoLeave = (event) => {
    const video = event.currentTarget.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.volume = 1;
    video.pause();
    video.currentTime = 0;
  };

  useEffect(() => {
    const hasOpenModal = detailOpen || selectedFlashback || selectedBioClip || hoverGalleryOpen;
    if (!hasOpenModal) return;

    const handleEsc = (event) => {
      if (event.key !== "Escape") return;

      if (hoverGalleryOpen) {
        setHoverGalleryOpen(false);
        return;
      }

      if (selectedBioClip) {
        setSelectedBioClip(null);
        return;
      }

      if (selectedFlashback) {
        setSelectedFlashback(null);
        return;
      }

      setDetailOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [detailOpen, hoverGalleryOpen, selectedFlashback, selectedBioClip]);

  return (
    <>
      <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_36px_rgba(255,255,255,0.1)]">
      <div
        className={`relative mb-4 overflow-hidden rounded-2xl ${visibleLighterSideImages.length ? 'cursor-pointer' : ''}`}
        onMouseEnter={handleBioImageEnter}
        onMouseLeave={handleBioImageLeave}
        onClick={() => {
          if (!visibleLighterSideImages.length) return;
          setActiveHoverGalleryIndex(activeHoverImageIndex);
          setHoverGalleryOpen(true);
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.16),transparent_62%)] opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition duration-300 group-hover:opacity-40" />
        {member.name === 'Cadence' ? <img src="https://exit-smiling-media.bennoclark.workers.dev/bio/cadence/cadence-main.jpg" alt="Cadence" loading="lazy" decoding="async" className={`${imageClassName} object-cover ${visibleLighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Lando' ? <img src="https://exit-smiling-media.bennoclark.workers.dev/bio/lando/lando-guitar-main.jpg" alt="Lando" loading="lazy" decoding="async" className={`${imageClassName} object-cover object-top ${visibleLighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Julian' ? <img src="https://exit-smiling-media.bennoclark.workers.dev/bio/julian/julian-main.jpg" alt="Julian" loading="lazy" decoding="async" className={`${imageClassName} bg-black object-contain ${visibleLighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Max' ? <img src="https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-live-bass.jpg" alt="Max" loading="lazy" decoding="async" className={`${imageClassName} object-cover ${visibleLighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Joey' ? <img src="https://exit-smiling-media.bennoclark.workers.dev/bio/joey/joey-guitar-main.jpg" alt="Joey" loading="lazy" decoding="async" className={`${imageClassName} object-cover object-top ${visibleLighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {visibleLighterSideImages?.length ? (
          <>
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 shadow-[0_0_18px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                Off Stage
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center">
              <div className="rounded-full border border-white/18 bg-black/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80 shadow-[0_0_18px_rgba(255,255,255,0.08)] backdrop-blur-sm">
                Click to enlarge
              </div>
            </div>
            {visibleLighterSideImages.map((image, index) => (
              <img
                key={`${member.name}-off-stage-${index}`}
                src={image.src}
                alt={`${member.name} off stage ${index + 1}`}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-500 ease-out [filter:contrast(1.08)_saturate(1.08)_brightness(1.02)] group-hover:scale-[1.12] ${image.className}`}
                style={
                  isHoveringBioImage && activeHoverImageIndex === index
                    ? { opacity: 1 }
                    : undefined
                }
              />
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/52 via-black/8 to-black/18 opacity-0 transition duration-300 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.14),transparent_58%)]" />
            {activeHoverImageCredit ? (
              <div className="pointer-events-none absolute right-4 top-4 z-30 rounded-full border border-white/18 bg-black/62 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 shadow-[0_0_16px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                {activeHoverImageCredit}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <h3 className="text-xl font-bold uppercase transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.18)]">
        {member.name}
      </h3>

      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/50 transition duration-300 group-hover:text-white/70">
        {member.role}
      </p>

      {livePreview ? (
        liveVideoSrc ? (
        <button
          type="button"
          className="group/live relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/60 transition duration-300 hover:border-white/25 hover:shadow-[0_0_28px_rgba(255,255,255,0.12)]"
          onClick={() => setSelectedBioClip(liveClipVideo)}
          onMouseEnter={handleLiveVideoEnter}
          onMouseLeave={handleLiveVideoLeave}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover/live:opacity-100" />
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.24)] backdrop-blur-sm">
            Live
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-100 transition duration-300 group-hover/live:opacity-0">
            <div className="rounded-full border border-white/35 bg-black/65 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white shadow-[0_0_24px_rgba(255,255,255,0.14)] backdrop-blur-sm">
              Hover for audio + motion
            </div>
          </div>
          <video
            ref={liveVideoRef}
            src={liveVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            onTimeUpdate={handleLiveVideoTimeUpdate}
            className="aspect-video w-full object-cover grayscale transition duration-500 ease-out group-hover/live:brightness-110"
            style={{ animation: 'livePulseZoom 7s ease-in-out infinite' }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-4 pt-10">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Bombtrack Live Snippet</p>
            <p className="mt-1 text-sm font-semibold uppercase text-white">{liveVideoLabel}</p>
          </div>
        </button>
        ) : (
        <div className="group/live relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/60 transition duration-300 hover:border-white/20 hover:shadow-[0_0_24px_rgba(255,255,255,0.08)]">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_65%)] opacity-100" />
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.06] via-black to-black">
            <div className="rounded-full border border-white/20 bg-white/[0.04] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/70 shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-sm">
              Coming Soon
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 pb-4 pt-10">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Live Snippet</p>
            <p className="mt-1 text-sm font-semibold uppercase text-white">{liveVideoLabel}</p>
          </div>
        </div>
        )
      ) : null}

      {member.name === 'Cadence' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Cadence is a young vocalist known for her powerful tone, wide range, and natural ability to adapt across a broad spectrum of musical styles. Her voice carries strength and emotion with dynamic versatility, leaving a lasting impact on her listeners.</p>
          <p className="mt-3 text-sm text-white/70">Cadence draws strong inspiration from iconic vocal artists such as Amy Lee of Evanescence and Emily Armstrong of Linkin Park, with these influences shaping her connection to a wide range of rock styles. However, her love of country, pop, and indie music follows closely behind, fuelling a musical journey that remains unconfined to any one genre, allowing her evolving skill to continually grow.</p>
          <p className="mt-3 text-sm text-white/70">Born and raised on the South Coast, Cadence's passion for singing and music began at a young age, naturally guiding her into the creative young artist she is quickly becoming. At the age of 13 she joined the band that later became Exit Smiling, marking the beginning of her experience as a live performer and lead vocalist.</p>
          <p className="mt-3 text-sm text-white/70">Although still early in her formal training, Cadence began receiving professional vocal coaching in August 2025 from a renowned opera singer based in the UK. A blend of modern with classical training continues to refine her natural ability, further develop her technique, and support her growth as an emerging musician.</p>
        </>
      ) : member.name === 'Joey' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Joey is a 14-year-old lead guitarist bringing raw energy and a rapidly evolving sound to modern rock.</p>
          <p className="mt-3 text-sm text-white/70">Born in Niseko, Japan, Joey picked up his first right-handed acoustic guitar at just seven years old. After relocating to Australia in 2018, he made the switch to left-handed electric guitar, a transition that helped shape his distinctive playing style and musical identity.</p>
          <p className="mt-3 text-sm text-white/70">Drawing influence from a wide range of alternative, nu-metal, and hard rock artists, Joey's playing blends tight, driving rhythm work with expressive lead lines. His approach is instinctive and feel-driven, always pushing beyond his years as he continues to develop both technically and creatively.</p>
          <p className="mt-3 text-sm text-white/70">As lead guitarist, Joey plays a key role in shaping the band's sound, balancing melody, aggression, and tone across both live performances and original music.</p>
          <p className="mt-3 text-sm text-white/70">He is the proud caretaker of a growing guitar lineup, including a Fender Telecaster, Fender Stratocaster, and a Gibson SG, each contributing to his expanding tonal range. His guitar quiver reflects his music mentors: Tom Morello (RATM), Jimi Hendrix (The Hendrix Experience), and Tony Iommi (Black Sabbath).</p>
          <p className="mt-3 text-sm text-white/70">Still early in his journey, Joey is focused on writing, performing, and carving out his place in the next generation of rock musicians.</p>
        </>
      ) : member.name === 'Max' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Max is the Exit Smiling bassist and has loved it since it all began in Julian's office, struggling through a 12-bar blues. Now he brings a funky, solid element to the band, both musically and socially, getting lost in jams with Julian, writing with the band, and heading out to switch off and have fun when he can (not too much fun).</p>
          <p className="mt-3 text-sm text-white/70">Max also enjoys mountain biking, skiing, hunting, and soccer, which he fuels with a lot of music, from shredding a pow day blasting Rage Against the Machine (not too loud, his parents don't want him to damage his ears) to listening to Hilltop Hoods to focus before a game.</p>
          <p className="mt-3 text-sm text-white/70">Max has a very wide taste in music, with bands like Rage Against the Machine, Linkin Park, Black Sabbath, The Beatles, Audioslave, Hilltop Hoods, and Powderfinger forming the backbone of his influence. However, local influences such as the legendary Dave Berry and The Spindrift Saga have been just as important. He takes lessons from Dave Berry in practical elements, from setting up an overdrive pedal to understanding the genius of an AC/DC song, while members of The Spindrift Saga have taught him the cold, hard theory required to tackle a range of musical challenges, no matter how repetitive it may seem. These local legends give him and the band real insight into the music industry and how bands operate within it.</p>
          <p className="mt-3 text-sm text-white/70">Max is from the South Coast and brings a regional approach to problems, with a laid-back, fun-loving energy that is a core part of the band and a big reason why he and the others have formed such a strong bond.</p>
        </>
      ) : member.name === 'Julian' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Julian is 14 years old and was born in Manchester, UK, the heart of music in 90s England, where big bands like Oasis, The Smiths, and The Stone Roses came from. Julian moved to Australia when he was just 1 and started drumming at the age of 5. The first gig he watched was Henge in England in 2017. He also learned to play the piano through COVID and continues to grow his musical skill set beyond just rhythm.</p>
          <p className="mt-3 text-sm text-white/70">Julian's main drumming influence comes from drummers such as Brad Wilks (RATM), Ringo Starr (The Beatles), and John Otto (Limp Bizkit). This influence brings a wide range of styles, such as hip hop, funk, and nu metal, into his drumming.</p>
          <p className="mt-3 text-sm text-white/70">Julian started writing and creating music with his younger brother during lockdown at age 10 and released a couple of music videos, which can still be tracked down on YouTube if you search hard enough. These videos gained enough attention to make it to the front page of the local paper, feature in The Canberra Times, and the boys were interviewed, with their songs played on ABC Radio.</p>
          <p className="mt-3 text-sm text-white/70">Julian has also competed and won the local St Cecilia Music Scholarships and competed with the top 20 drummers in Years 7-9 in NSW in the final of the OSIC drum competition. He has been taking lessons from one of Australia's best jazz drummers, a former ANU drum teacher, using this to blend classical technique with more modern rock styles.</p>
          <p className="mt-3 text-sm text-white/70">Julian's ambition would be to one day get sponsored by Heinz and Adidas, and he would like to receive unlimited free products from both companies.</p>
        </>
      ) : member.name === 'Lando' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Sharing the role of vocals, Lando brings high energy with a good dose of swagger to the stage.</p>
          <p className="mt-3 text-sm text-white/70">An eclectic mix of musical styles from his early years has helped him develop a powerful and vibrant vocal tone, punching out rhymes in style.</p>
          <p className="mt-3 text-sm text-white/70">Complementing his powerhouse vocals, Lando also delivers rhythm and artistic flair through backing guitar.</p>
          <p className="mt-3 text-sm text-white/70">Drawing influence and inspiration from legendary bands such as Nirvana, Rage Against the Machine, and Linkin Park, Lando aspires to bring raw and honest energy to the stage.</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-white/60">Bio coming soon.</p>
      )}

      {bioClipVideo ? (
        <button
          type="button"
          className="group/bioclip relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/70 transition duration-300 hover:border-white/25 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
          onClick={() => setSelectedBioClip(bioClipVideo)}
          onMouseEnter={handleBioClipEnter}
          onMouseLeave={handleBioClipLeave}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover/bioclip:opacity-100" />
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-100 transition duration-300 group-hover/bioclip:opacity-0">
            <div className="rounded-full border border-white/35 bg-black/65 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white shadow-[0_0_24px_rgba(255,255,255,0.14)] backdrop-blur-sm">
              Hover for audio + motion
            </div>
          </div>
          <video
            ref={bioClipVideoRef}
            src={bioClipVideo.src}
            poster={bioClipVideo.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onTimeUpdate={handleBioClipTimeUpdate}
            className="aspect-video w-full object-cover transition duration-500 ease-out group-hover/bioclip:scale-[1.03] group-hover/bioclip:brightness-110"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-10">
            <div className="rounded-full border border-white/30 bg-black/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white shadow-[0_0_20px_rgba(255,255,255,0.12)] backdrop-blur-sm">
              Click to enlarge
            </div>
          </div>
        </button>
      ) : null}

      {canShowPrivateMemberDetails ? (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="mt-5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-white/28 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
        >
          Not Just a Musician
        </button>
      ) : null}
      </div>

      {detailOpen && canShowPrivateMemberDetails ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/88 p-4"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/12 bg-[#090909] p-6 shadow-[0_0_40px_rgba(255,255,255,0.1)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_48%)]" />
            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
            >
              Close
            </button>
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Beyond the Band</p>
            <h3 className="mt-3 text-3xl font-black uppercase text-white md:text-4xl">{member.name}</h3>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/45">{member.role}</p>
            <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Achievements</h4>
                <p className="mt-4 whitespace-pre-line text-base leading-8 text-white/72">{memberAchievements}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">Flashbacks!</h4>
                <div className="mt-4 space-y-4">
                  {detailVideos.map((video) => (
                    <button
                      key={video.src}
                      type="button"
                      className="group/detailvideo relative overflow-hidden rounded-2xl border border-white/10 bg-black/70 transition duration-300 hover:border-white/25 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
                      onClick={() => setSelectedFlashback(video)}
                      onMouseEnter={video.type === 'video' ? handleDetailVideoEnter : undefined}
                      onMouseLeave={video.type === 'video' ? handleDetailVideoLeave : undefined}
                    >
                      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover/detailvideo:opacity-100" />
                      {video.type === 'video' ? (
                        <>
                          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-100 transition duration-300 group-hover/detailvideo:opacity-0">
                            <div className="rounded-full border border-white/35 bg-black/65 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white shadow-[0_0_24px_rgba(255,255,255,0.14)] backdrop-blur-sm">
                              Hover for motion
                            </div>
                          </div>
                          <video
                            src={video.src}
                            poster={video.poster}
                            data-volume={video.volume ?? 1}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full object-cover transition duration-500 ease-out group-hover/detailvideo:scale-[1.03] group-hover/detailvideo:brightness-110"
                          />
                        </>
                      ) : (
                        <img
                          src={video.src}
                          alt={video.title}
                          loading="lazy"
                          decoding="async"
                          className="aspect-video w-full object-cover transition duration-500 ease-out group-hover/detailvideo:scale-[1.03] group-hover/detailvideo:brightness-110"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-10">
                        <p className="text-sm font-semibold uppercase text-white">{video.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedFlashback ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedFlashback(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/12 bg-[#090909] p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)] md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedFlashback(null)}
              className="absolute right-5 top-5 z-20 text-sm uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
            >
              Close
            </button>
            <div className="mb-4 pr-24">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Flashback</p>
              <h4 className="mt-2 text-2xl font-black uppercase text-white">{selectedFlashback.title}</h4>
            </div>
            {selectedFlashback.type === 'video' ? (
              <video
                src={selectedFlashback.src}
                poster={selectedFlashback.poster}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] w-full rounded-2xl bg-black object-contain"
              />
            ) : (
              <img
                src={selectedFlashback.src}
                alt={selectedFlashback.title}
                decoding="async"
                className="max-h-[78vh] w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </div>
      ) : null}

      {selectedBioClip ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedBioClip(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/12 bg-[#090909] p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)] md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBioClip(null)}
              className="absolute right-5 top-5 z-20 text-sm uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
            >
              Close
            </button>
            <div className={`pr-24 ${selectedBioClip.title ? "mb-4" : "mb-1"}`}>
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Video Clip</p>
              {selectedBioClip.title ? (
                <h4 className="mt-2 text-2xl font-black uppercase text-white">{selectedBioClip.title}</h4>
              ) : null}
            </div>
            <video
              src={selectedBioClip.src}
              poster={selectedBioClip.poster}
              controls
              autoPlay
              playsInline
              onTimeUpdate={(event) => {
                const endAtSeconds = Number(selectedBioClip.endAtSeconds || 0);
                if (!endAtSeconds) return;

                if (event.currentTarget.currentTime >= endAtSeconds) {
                  event.currentTarget.pause();
                  event.currentTarget.currentTime = 0;
                }
              }}
              className="max-h-[78vh] w-full rounded-2xl bg-black object-contain"
            />
          </div>
        </div>
      ) : null}

      {hoverGalleryOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/92 p-4"
          onClick={() => setHoverGalleryOpen(false)}
        >
          <div className="w-full max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#090909] p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)] md:p-6">
              <button
                type="button"
                onClick={() => setHoverGalleryOpen(false)}
                className="absolute right-5 top-5 z-20 text-sm uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
              >
                Close
              </button>
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                {visibleLighterSideImages.map((image, index) => (
                  <img
                    key={`${member.name}-hover-gallery-${index}`}
                    src={image.src}
                    alt={`${member.name} gallery ${index + 1}`}
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-contain transition duration-700 ease-out ${index === activeHoverGalleryIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'} ${image.className}`}
                  />
                ))}
                {activeHoverGalleryCredit ? (
                  <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-white/18 bg-black/62 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 shadow-[0_0_16px_rgba(0,0,0,0.24)] backdrop-blur-sm">
                    {activeHoverGalleryCredit}
                  </div>
                ) : null}
                <div className="aspect-[4/5] w-full" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-5 pb-5 pt-12">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Off Stage</p>
                  <p className="mt-2 text-2xl font-black uppercase text-white">{member.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function BandLivePreview() {
  const videoRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewStartTime = 1.2;
  const thumbnailSrc =
    "https://exit-smiling-media.bennoclark.workers.dev/videos/posters/hometown-hero-preview.jpg";
  const previewVideoSrc =
    "https://exit-smiling-media.bennoclark.workers.dev/videos/hometown-hero-preview.mp4";

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) return;

    setAspectRatio(video.videoWidth / video.videoHeight);
    video.currentTime = previewStartTime;
  };

  const handlePreviewHoverEnter = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      video.volume = 1;
      await video.play();
    } catch {
      video.muted = true;
      video.volume = 1;
      await video.play().catch(() => {});
    }
  };

  const handlePreviewHoverLeave = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 1;
  };

  const openPreview = () => {
    const video = videoRef.current;
    setPreviewOpen(true);

    if (!video) return;

    video.pause();
    video.currentTime = previewStartTime;
    video.muted = true;
    video.volume = 1;
  };

  useEffect(() => {
    if (!previewOpen) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewOpen]);

  return (
    <>
      <div
        className="group/liveband relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_36px_rgba(255,255,255,0.12)]"
        onClick={openPreview}
        onMouseEnter={handlePreviewHoverEnter}
        onMouseLeave={handlePreviewHoverLeave}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.14),transparent_55%)] opacity-0 transition duration-300 group-hover/liveband:opacity-100" />
        <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/85">
          <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.24)] backdrop-blur-sm">
            Live
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="rounded-full border border-white/35 bg-black/65 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-white shadow-[0_0_24px_rgba(255,255,255,0.14)] backdrop-blur-sm">
              Hover for audio - click to expand
            </div>
          </div>
          <video
            ref={videoRef}
            src={previewVideoSrc}
            poster={thumbnailSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
            className="relative z-10 max-h-[70vh] w-full object-contain grayscale transition duration-500 ease-out group-hover/liveband:scale-[1.02] group-hover/liveband:brightness-110"
            style={{ aspectRatio: aspectRatio || undefined }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pb-5 pt-12">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Band Live Snippet</p>
            <p className="mt-1 text-sm font-semibold uppercase text-white">Exit Smiling in motion</p>
          </div>
        </div>
      </div>
      {previewOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/12 bg-[#090909] p-4 shadow-[0_0_40px_rgba(255,255,255,0.12)] md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-5 top-5 z-20 text-sm uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
            >
              Close
            </button>
            <div className="mb-4 pr-24">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Band Live Snippet</p>
              <h4 className="mt-2 text-2xl font-black uppercase text-white">Exit Smiling in motion</h4>
            </div>
            <video
              src={previewVideoSrc}
              poster={thumbnailSrc}
              controls
              controlsList="nofullscreen nodownload noremoteplayback"
              autoPlay
              disablePictureInPicture
              playsInline
              className="max-h-[78vh] w-full rounded-2xl bg-black object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function BandHeadingFigures() {
  const bandHeadingFigures = [
    {
      name: "Max",
      src: "https://exit-smiling-media.bennoclark.workers.dev/animations/band-silhouettes/max-white.png",
    },
    {
      name: "Lando",
      src: "https://exit-smiling-media.bennoclark.workers.dev/animations/band-silhouettes/lando-white.png",
    },
    {
      name: "Cadence",
      src: "https://exit-smiling-media.bennoclark.workers.dev/animations/band-silhouettes/cadence-white.png",
    },
    {
      name: "Joey",
      src: "https://exit-smiling-media.bennoclark.workers.dev/animations/band-silhouettes/joey-white.png",
    },
    {
      name: "Julian",
      src: "https://exit-smiling-media.bennoclark.workers.dev/animations/band-silhouettes/julian-white.png",
    },
  ];
  const [figureState, setFigureState] = useState({
    activeIndex: 0,
    previousIndex: null,
    activeColorIndex: 0,
    previousColorIndex: 0,
  });
  const figureColorFilters = [
    "brightness(0) saturate(100%) invert(84%) sepia(85%) saturate(1022%) hue-rotate(356deg) brightness(103%) contrast(101%)",
    "brightness(0) saturate(100%) invert(63%) sepia(4%) saturate(300%) hue-rotate(11deg) brightness(94%) contrast(88%)",
    "brightness(0) invert(1)",
    "brightness(0) saturate(100%) invert(11%) sepia(6%) saturate(602%) hue-rotate(12deg) brightness(92%) contrast(90%)",
  ];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFigureState((prev) => {
        if (bandHeadingFigures.length <= 1) return prev;

        let next = prev.activeIndex;
        while (next === prev.activeIndex) {
          next = Math.floor(Math.random() * bandHeadingFigures.length);
        }

        return {
          activeIndex: next,
          previousIndex: prev.activeIndex,
          activeColorIndex: (prev.activeColorIndex + 1) % figureColorFilters.length,
          previousColorIndex: prev.activeColorIndex,
        };
      });
    }, 1465);

    return () => window.clearTimeout(timeout);
  }, [figureState.activeIndex, bandHeadingFigures.length]);

  return (
    <div
      className="flex h-12 w-full max-w-[22rem] items-end justify-between md:h-16 lg:h-20"
      aria-label="Exit Smiling band member silhouettes"
    >
      {bandHeadingFigures.map((figure, index) => (
        <div key={figure.name} className="relative h-full w-7 md:w-9 lg:w-11">
          <img
            src={figure.src}
            alt={figure.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_0_14px_rgba(255,255,255,0.16)] transition-opacity duration-[1200ms] ease-in-out ${
              index === figureState.activeIndex
                ? "opacity-100"
                : index === figureState.previousIndex
                  ? "opacity-0"
                  : "opacity-0"
            }`}
            style={{
              filter: figureColorFilters[
                index === figureState.activeIndex
                  ? figureState.activeColorIndex
                  : index === figureState.previousIndex
                    ? figureState.previousColorIndex
                    : figureState.activeColorIndex
              ],
            }}
          />
        </div>
      ))}
    </div>
  );
}

function Band() {
  const bandBioImages = [
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-02.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-04.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-03.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/hero/band-hero-01.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/press/exit-smiling-smoke-band.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/bio/band/band-live-photo-01.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://exit-smiling-media.bennoclark.workers.dev/bio/max/max-asleep.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
  ];
  const [activeBandBioImageIndex, setActiveBandBioImageIndex] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveBandBioImageIndex((prev) => (prev + 1) % bandBioImages.length);
    }, 3600);

    return () => window.clearTimeout(timeout);
  }, [activeBandBioImageIndex, bandBioImages.length]);

  return (
    <section id="about" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12">
        <SectionTitle>The Band</SectionTitle>
      </div>
      <div className="mb-16 grid gap-10 md:grid-cols-2 md:items-start">
        <div className="max-w-3xl space-y-6 text-white/70">
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.1s', opacity: 0 }}>Exit Smiling are a band bonded by music, shared energy, and a serious sense of fun. The five-piece from Malua Bay and Broulee officially formed in November 2024, when the idea of starting a band quickly became their passion. The lineup brings together Joey on guitar, Julian on drums, Lando on guitar and vocals, Max on bass, and Cadence on vocals. Each member brings their own background and creativity, from Julians award-winning musicianship and hip hop projects to Joey and Julians earlier filmmaking and songwriting adventures.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.25s', opacity: 0 }}>From the outset, Exit Smiling embraced a bold sound and playful spirit. Influenced by Rage Against the Machine, Limp Bizkit, the Beastie Boys, and The Beatles, they write collaboratively, blending riffs and grooves with lyrics pulled from both thrift shop finds and their sharp-eyed observations of the world around them. Their style is unapologetically loud, fun, and confident, resulting in a band that takes their music seriously while refusing to take themselves too seriously.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.4s', opacity: 0 }}>In a world where many teenagers are overloaded by devices, doom-scrolling, and endless online noise, Exit Smiling are busy doing something different. Between school, rehearsals, songwriting, gig preparation, recording ideas, and building the band from the ground up, they are creating more than they consume. Their momentum gives them a real-world outlet for their energy, friendships, and creativity.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.55s', opacity: 0 }}>On stage, Exit Smiling thrive on energy and connection. Their rehearsals are chatty and buzzing, but their live performances are tight, engaging, and designed to leave the crowd doing exactly what their name promises. They have already made their mark at venues like Smokey Dans, Starfish Deli Live, and Nelligen Hotel, won their school Battle of the Bands and the Eurobodalla Battle of the Bands, and supported local heroes like Flavuh and Archie. Their biggest highlights so far include having their originals played on ABC Radio, joining the Younite program, and sharing stages with bands and artists they admire, including Merci, Mercy, Thunderfox, Flavuh, Archie, and Spindrift Saga, to name a few.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.7s', opacity: 0 }}>Looking ahead, Exit Smiling are ambitious. Their short-term goals include recording a full album of originals, finding a manager or label, and building their presence as working musicians. Long term, they dream of collaborating with their inspirations and taking their music on international tours, with Europe, Canada, and Japan high on the wish list.</p>
        </div>
        <div className="relative">
          <div className="group/bandmoments relative overflow-hidden rounded-3xl border border-white/10">
            {bandBioImages.map((image, index) => (
              <img
                key={image.src}
                src={image.src}
                alt="Exit Smiling band"
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out ${image.className} ${
                  index === activeBandBioImageIndex ? "scale-[1.03] opacity-100" : "scale-100 opacity-0"
                }`}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.14),transparent_62%)]" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/8 to-black/18" />
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between">
              <div className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 shadow-[0_0_18px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                Band Moments
              </div>
            </div>
            <div className="pb-[100%]" />
          </div>
          <BandLivePreview />
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

function PressImageLibraryModal({ open, onClose, assets }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.id));
  const previewAsset = selectedAssets[0] || assets[0];

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  if (!open) return null;

  const toggleSelected = (assetId) => {
    setSelectedIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  };

  return (
    <div className="fixed inset-0 z-[145] overflow-y-auto bg-black/92 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-yellow-100/70">Press Image Library</p>
            <h2 className="mt-2 text-3xl font-black uppercase text-white md:text-5xl">Select / Download</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
            <img
              src={previewAsset.href}
              alt={previewAsset.alt}
              decoding="async"
              className="max-h-[72vh] w-full rounded-2xl object-contain bg-black"
            />
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-yellow-100/65">{previewAsset.category}</p>
              <h3 className="mt-2 text-2xl font-black uppercase text-white">{previewAsset.title}</h3>
              <p className="mt-2 text-sm text-white/55">{previewAsset.usage}</p>
            </div>
          </div>

          <div className="grid max-h-[82vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);

              return (
                <article
                  key={asset.id}
                  className={`rounded-3xl border p-3 transition ${
                    isSelected
                      ? "border-yellow-200/55 bg-yellow-200/10"
                      : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.055]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelected(asset.id)}
                    className="group relative block w-full overflow-hidden rounded-2xl bg-black text-left"
                  >
                    <img
                      src={asset.href}
                      alt={asset.alt}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-110"
                    />
                    <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
                      {isSelected ? "Selected" : "Select"}
                    </div>
                  </button>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-white/42">{asset.category}</p>
                  <h3 className="mt-1 text-sm font-black uppercase text-white">{asset.title}</h3>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={asset.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
                    >
                      Preview
                    </a>
                    <a
                      href={asset.href}
                      download={asset.fileName}
                      className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
                    >
                      Download
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoAssetGrid({ logos }) {
  const downloadAllLogos = () => {
    logos.forEach((logo, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = logo.href;
        link.download = logo.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 120);
    });
  };

  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-yellow-100/65">Transparent Logo Assets</p>
          <h3 className="mt-2 text-xl font-black uppercase text-white">White / Black / Yellow</h3>
        </div>
        <button
          type="button"
          onClick={downloadAllLogos}
          className="rounded-full border border-white/18 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
        >
          Download All Logos
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {logos.map((logo) => (
          <article
            key={logo.id}
            className="group/logo rounded-2xl border border-white/10 bg-white/[0.025] p-3 transition duration-300 hover:z-10 hover:-translate-y-1 hover:border-yellow-200/40 hover:bg-yellow-200/8 hover:shadow-[0_0_34px_rgba(250,204,21,0.14)]"
          >
            <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-white/8 p-4 transition duration-300 group-hover/logo:scale-[1.08] ${logo.previewClassName}`}>
              <img
                src={logo.href}
                alt={logo.alt}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain transition duration-300 group-hover/logo:scale-[1.18]"
              />
            </div>
            <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white">{logo.title}</p>
            <p className="mt-1 text-center text-[10px] text-white/45">Transparent PNG</p>
            <a
              href={logo.href}
              download={logo.fileName}
              className="mt-3 block rounded-full border border-white/12 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
            >
              Download
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PressKit({ standalone = false }) {
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const logoAssets = [
    {
      id: "logo-white",
      title: "White Logo",
      href: "/press-kit/images/exit-smiling-logo-white.png",
      fileName: "exit-smiling-logo-white-transparent.png",
      alt: "Exit Smiling white transparent logo",
      previewClassName: "bg-zinc-950",
    },
    {
      id: "logo-black",
      title: "Black Logo",
      href: "/press-kit/images/exit-smiling-logo-black.png",
      fileName: "exit-smiling-logo-black-transparent.png",
      alt: "Exit Smiling black transparent logo",
      previewClassName: "bg-white",
    },
    {
      id: "logo-yellow",
      title: "Yellow Logo",
      href: "/press-kit/images/exit-smiling-logo-yellow.png",
      fileName: "exit-smiling-logo-yellow-transparent.png",
      alt: "Exit Smiling yellow transparent logo",
      previewClassName: "bg-zinc-950",
    },
  ];
  const pressImages = [
    {
      id: "press-01",
      title: "Press Photo 01",
      category: "Press photo",
      usage: "Primary press-set image for media, posters, and venue listings.",
      href: "/press-kit/images/press/exit-smiling-press-01.jpg",
      fileName: "exit-smiling-press-01.jpg",
      alt: "Exit Smiling press photo 01",
    },
    {
      id: "press-01b",
      title: "Press Photo 01B",
      category: "Press photo",
      usage: "Alternate crop from the official press photo set.",
      href: "/press-kit/images/press/exit-smiling-press-01b.jpg",
      fileName: "exit-smiling-press-01b.jpg",
      alt: "Exit Smiling press photo 01B",
    },
    {
      id: "press-02",
      title: "Press Photo 02",
      category: "Press photo",
      usage: "Official press-set image for features, listings, and social tiles.",
      href: "/press-kit/images/press/exit-smiling-press-02.jpg",
      fileName: "exit-smiling-press-02.jpg",
      alt: "Exit Smiling press photo 02",
    },
    {
      id: "press-03",
      title: "Press Photo 03",
      category: "Press photo",
      usage: "Official press-set image for features, listings, and social tiles.",
      href: "/press-kit/images/press/exit-smiling-press-03.jpg",
      fileName: "exit-smiling-press-03.jpg",
      alt: "Exit Smiling press photo 03",
    },
    {
      id: "press-03b",
      title: "Press Photo 03B",
      category: "Press photo",
      usage: "Alternate crop from the official press photo set.",
      href: "/press-kit/images/press/exit-smiling-press-03b.jpg",
      fileName: "exit-smiling-press-03b.jpg",
      alt: "Exit Smiling press photo 03B",
    },
    {
      id: "press-04",
      title: "Press Photo 04",
      category: "Press photo",
      usage: "Official press-set image for features, listings, and social tiles.",
      href: "/press-kit/images/press/exit-smiling-press-04.jpg",
      fileName: "exit-smiling-press-04.jpg",
      alt: "Exit Smiling press photo 04",
    },
    {
      id: "press-04b",
      title: "Press Photo 04B",
      category: "Press photo",
      usage: "Alternate crop from the official press photo set.",
      href: "/press-kit/images/press/exit-smiling-press-04b.jpg",
      fileName: "exit-smiling-press-04b.jpg",
      alt: "Exit Smiling press photo 04B",
    },
    {
      id: "press-05",
      title: "Press Photo 05",
      category: "Press photo",
      usage: "Official press-set image for features, listings, and social tiles.",
      href: "/press-kit/images/press/exit-smiling-press-05.jpg",
      fileName: "exit-smiling-press-05.jpg",
      alt: "Exit Smiling press photo 05",
    },
    {
      id: "press-05b",
      title: "Press Photo 05B",
      category: "Press photo",
      usage: "Alternate crop from the official press photo set.",
      href: "/press-kit/images/press/exit-smiling-press-05b.jpg",
      fileName: "exit-smiling-press-05b.jpg",
      alt: "Exit Smiling press photo 05B",
    },
    {
      id: "band-press-photo",
      title: "Band Press Photo",
      category: "Press photo",
      usage: "Primary image for press, posters, venue listings, and articles.",
      href: "/press-kit/images/exit-smiling-band-press-photo.jpg",
      fileName: "exit-smiling-band-press-photo.jpg",
      alt: "Exit Smiling band press photo",
    },
    {
      id: "smoke-band",
      title: "Smoke Band Image",
      category: "Atmospheric band photo",
      usage: "Use for feature banners, social announcements, and hero graphics.",
      href: "/press-kit/images/exit-smiling-smoke-band.jpg",
      fileName: "exit-smiling-smoke-band.jpg",
      alt: "Exit Smiling band in smoke lighting",
    },
    {
      id: "live-01",
      title: "Live Band Photo",
      category: "Live image",
      usage: "Use for gig previews, venue posts, and live-show promotion.",
      href: "/press-kit/images/exit-smiling-live-01.jpg",
      fileName: "exit-smiling-live-01.jpg",
      alt: "Exit Smiling live performance photo",
    },
    {
      id: "live-photo-01",
      title: "Live Stage Photo",
      category: "Live image",
      usage: "Use for stage, festival, and event listings.",
      href: "/press-kit/images/live/exit-smiling-live-photo-01.jpg",
      fileName: "exit-smiling-live-photo-01.jpg",
      alt: "Exit Smiling live stage photo",
    },
    {
      id: "live-photo-02",
      title: "Live Photo 02",
      category: "Live image",
      usage: "Use for gig previews, venue posts, and live-show promotion.",
      href: "/press-kit/images/live/exit-smiling-live-photo-02.jpg",
      fileName: "exit-smiling-live-photo-02.jpg",
      alt: "Exit Smiling live photo 02",
    },
    {
      id: "live-photo-03",
      title: "Live Photo 03",
      category: "Live image",
      usage: "Use for gig previews, venue posts, and live-show promotion.",
      href: "/press-kit/images/live/exit-smiling-live-photo-03.jpg",
      fileName: "exit-smiling-live-photo-03.jpg",
      alt: "Exit Smiling live photo 03",
    },
    {
      id: "live-photo-04",
      title: "Live Photo 04",
      category: "Live image",
      usage: "Use for gig previews, venue posts, and live-show promotion.",
      href: "/press-kit/images/live/exit-smiling-live-photo-04.jpg",
      fileName: "exit-smiling-live-photo-04.jpg",
      alt: "Exit Smiling live photo 04",
    },
    {
      id: "abc-radio",
      title: "ABC Radio Studio",
      category: "Media appearance",
      usage: "Use when referencing ABC Radio or interview coverage.",
      href: "/press-kit/images/exit-smiling-abc-radio-studio.jpg",
      fileName: "exit-smiling-abc-radio-studio.jpg",
      alt: "Exit Smiling in ABC Radio studio",
    },
    {
      id: "single-cover",
      title: "Debut Single Cover",
      category: "Release artwork",
      usage: "Use for debut single, release, and music-preview coverage.",
      href: "/press-kit/images/exit-smiling-single-cover.png",
      fileName: "exit-smiling-single-cover.png",
      alt: "Exit Smiling debut single cover",
    },
    {
      id: "logo-white",
      title: "White Logo",
      category: "Logo asset",
      usage: "Transparent PNG logo asset. Use on dark backgrounds.",
      href: "/press-kit/images/exit-smiling-logo-white.png",
      fileName: "exit-smiling-logo-white-transparent.png",
      alt: "Exit Smiling white logo",
    },
    {
      id: "logo-black",
      title: "Black Logo",
      category: "Logo asset",
      usage: "Transparent PNG logo asset. Use on light backgrounds.",
      href: "/press-kit/images/exit-smiling-logo-black.png",
      fileName: "exit-smiling-logo-black-transparent.png",
      alt: "Exit Smiling black logo",
    },
    {
      id: "logo-yellow",
      title: "Yellow Logo",
      category: "Logo asset",
      usage: "Transparent PNG logo asset. Use when a high-impact brand mark is needed.",
      href: "/press-kit/images/exit-smiling-logo-yellow.png",
      fileName: "exit-smiling-logo-yellow-transparent.png",
      alt: "Exit Smiling yellow logo",
    },
  ];
  const pressPhotoUrl = pressImages[0].href;
  const pressLinks = [
    { href: "https://www.instagram.com/exitsmiling33/", label: "Instagram" },
    { href: "https://www.facebook.com/profile.php?id=61584318366927", label: "Facebook" },
    { href: "https://www.youtube.com/@ExitSmiling-u8i", label: "YouTube" },
    { href: "https://www.tiktok.com/@exit_smiling", label: "TikTok" },
  ];
  const highlights = [
    "Debut single launch: Starfish Sessions, Batemans Bay - June 12, 2026.",
    "Original music played on ABC Radio, including live studio interview content.",
    "Winners of school Battle of the Bands and Eurobodalla Battle of the Bands.",
    "Live appearances at Smokey Dans, Starfish Deli Live, Nelligen Hotel, Narooma Oyster Festival, and more.",
    "Shared bills or stages with Flavuh, Archie, Merci, Mercy, Thunderfox, Spindrift Saga, and other South Coast artists.",
  ];
  const videos = [
    {
      title: "Bombtrack (RATM Cover)",
      subtitle: "Live performance video",
      youtubeId: "nlqhNT8FOuk",
    },
    {
      title: "ABC Radio Live Show",
      subtitle: "Live with Alice Ansara",
      youtubeId: "FhFmBOPrCkw",
    },
  ];

  return (
    <section
      id="press-kit"
      className={`${standalone ? "min-h-screen" : "scroll-mt-32 border-y border-white/10"} bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.012)),radial-gradient(circle_at_80%_15%,rgba(250,204,21,0.13),transparent_34%)]`}
    >
      <div className="mx-auto max-w-7xl px-6 py-20">
        {standalone ? (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-white/35 hover:bg-white/10">
              <img src={brand.markLogo} alt={brand.logoAlt} decoding="async" className="h-8 w-8 object-contain" />
              Exit Smiling
            </a>
            <div className="flex flex-wrap gap-2">
              <a href="/" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white">
                Main Site
              </a>
              <a href="/#store" className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white">
                Merch
              </a>
            </div>
          </div>
        ) : null}
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-yellow-100/70">Electronic Press Kit</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-6xl">
              Press / Media Kit
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
              Exit Smiling are a South Coast NSW teenage band building a fast-moving live reputation around original songs, high-energy covers, and a genuine community following. Their site, live show, merch stand, and media presence are being built around the same independent DIY energy as the band.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 md:text-base">
              For booking, press, festival, radio, school, and venue enquiries, use the contacts below or link directly to the official social channels.
            </p>
            <div className="mt-6 rounded-3xl border border-yellow-200/18 bg-yellow-200/8 p-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-100/70">Why Exit Smiling?</p>
              <h3 className="mt-3 text-2xl font-black uppercase leading-none text-white">
                Deeper than just a smile
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/68">
                <p>
                  Max&apos;s avid reading inspired the name Exit Smiling. He uncovered the paradox at the heart of Catch-22: trapped by rules that contradict themselves where even our escape depends on playing along with the system. Perhaps you can relate?
                </p>
                <p className="font-black uppercase tracking-[0.12em] text-yellow-50">
                  Smile. Agree. Move on.
                </p>
                <p>
                  While that might work for our world systems, it won&apos;t work for us. As a band, we have no filters, no fake exits. Just our creativity and noise telling the truth.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setImageLibraryOpen(true)}
                className="rounded-2xl border border-white bg-white px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90"
              >
                Open Image Library
              </button>
              <a
                href={pressPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/12 bg-white/[0.035] px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-white/35 hover:bg-white/10"
              >
                Open Press Photo
              </a>
            </div>
            <LogoAssetGrid logos={logoAssets} />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/45 p-3 shadow-[0_0_34px_rgba(255,255,255,0.08)]">
            <img
              src={pressPhotoUrl}
              alt="Exit Smiling press photo"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-2xl object-cover object-center"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <h3 className="text-xl font-black uppercase tracking-[0.08em] text-white">Fast Facts</h3>
            <div className="mt-5 grid gap-3 text-sm text-white/68">
              <p><span className="font-semibold text-white">Location:</span> South Coast NSW, Australia</p>
              <p><span className="font-semibold text-white">Style:</span> Young alternative rock band, original songs, live covers, high-energy local shows</p>
              <p><span className="font-semibold text-white">Current focus:</span> Debut single launch, live shows, studio sessions, and official merch</p>
              <p><span className="font-semibold text-white">Booking:</span> <a href="mailto:megan@goodvibesentertainment.com.au" className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white">megan@goodvibesentertainment.com.au</a></p>
              <p><span className="font-semibold text-white">Band contact:</span> <a href="mailto:paul@pauldolphindesigns.com.au" className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white">paul@pauldolphindesigns.com.au</a></p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {pressLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <h3 className="text-xl font-black uppercase tracking-[0.08em] text-white">Notable Highlights</h3>
            <div className="mt-5 space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex gap-3 rounded-2xl border border-white/8 bg-black/24 p-3 text-sm leading-6 text-white/68">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-200" />
                  <p>{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {videos.map((video) => (
            <article key={video.youtubeId} className="overflow-hidden rounded-3xl border border-white/10 bg-black/45">
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
                  title={video.title}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="h-full w-full border-0"
                />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-yellow-100/62">{video.subtitle}</p>
                <h3 className="mt-2 text-xl font-black uppercase text-white">{video.title}</h3>
              </div>
            </article>
          ))}
        </div>
        <PressImageLibraryModal
          open={imageLibraryOpen}
          onClose={() => setImageLibraryOpen(false)}
          assets={pressImages}
        />
      </div>
    </section>
  );
}

function FanListSignup() {
  const [email, setEmail] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [status, setStatus] = useState({ tone: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus({ tone: "error", message: "Enter a valid email address." });
      return;
    }

    if (!consentChecked) {
      setStatus({ tone: "error", message: "Please confirm you are happy to receive Exit Smiling updates." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: "idle", message: "" });

    try {
      await registerFanUpdatesAccess({
        email: normalizedEmail,
        consentChecked: true,
        source: "website_fan_list",
      });

      setEmail("");
      setConsentChecked(false);
      setStatus({
        tone: "success",
        message: "You're on the list. We'll only send occasional release, gig, and merch updates.",
      });
    } catch (err) {
      setStatus({
        tone: "error",
        message: err.message || "Could not join the list right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="fan-list" className="scroll-mt-32 border-y border-white/10 bg-[radial-gradient(circle_at_15%_20%,rgba(250,204,21,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-yellow-100/72">Fan list</p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-white md:text-5xl">
            Release drops, gig alerts, merch restocks.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/64 md:text-base">
            Join the Exit Smiling list for occasional updates when new music, live shows, limited merch, or print runs go live.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-black/55 p-5 shadow-[0_0_34px_rgba(0,0,0,0.2)] backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/32 outline-none transition focus:border-yellow-200/50 focus:bg-white/[0.07]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Joining..." : "Join"}
            </button>
          </div>

          <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-white/56">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
              className="mt-1 h-4 w-4 accent-yellow-200"
            />
            <span>I consent to receive occasional Exit Smiling updates by email. No spam.</span>
          </label>

          {status.message ? (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              status.tone === "success"
                ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                : "border-red-300/25 bg-red-300/10 text-red-100"
            }`}>
              {status.message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function StudioSessions({ onOpenStudio }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-10 border-t border-white/10 pt-20">
        <SectionTitle>Studio Sessions <span className="text-white/45">(Registered Fans)</span></SectionTitle>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">A private selection of rough studio-session edits. Register your email by clicking on either video and opting in to our email list. You'll only receive new gig updates!</p>
      </div>
      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-1">
        {studioSessions.map((video) => (
          <button key={video.title} type="button" onClick={() => onOpenStudio(video)} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition hover:bg-white/[0.06]">
            <div className="relative aspect-[16/9] overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${video.thumb})` }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />
              <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm">Private</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/40 backdrop-blur-sm transition duration-300 group-hover:scale-110 group-hover:bg-black/55">
                  <div className="ml-1 border-l-[10px] border-l-white border-y-[6px] border-y-transparent" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Studio Sessions</p>
                <h3 className="mt-2 text-lg font-bold uppercase">{video.title}</h3>
                <p className="mt-1 text-sm text-white/65">{video.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const socialButtonClass = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition duration-300 hover:border-white/35 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]';

  return (
    <footer className="border-t border-white/10 px-6 py-10 text-sm text-white/50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4 xl:items-start">
        <div>
          <div className="flex items-center gap-3">
            <img src={brand.markLogo} alt={brand.logoAlt} loading="lazy" decoding="async" className="h-8 w-8 rounded-full border border-white/10 object-cover" />
            <span>(c) 2026 {brand.name}</span>
          </div>
          <a
            href="/epk"
            className="mt-4 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            Press Kit
          </a>
        </div>

        <div className="text-white/70">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/50">Bookings</p>
          <p className="font-semibold text-white">Megan Small</p>
          <p>Good Vibes Entertainment</p>
          <p>
            <a href="mailto:megan@goodvibesentertainment.com.au" className="hover:text-white">
              megan@goodvibesentertainment.com.au
            </a>
          </p>
          <p>
            <a href="tel:+61244080108" className="hover:text-white">
              (02) 4408 0108
            </a>
          </p>
        </div>

        <div className="text-white/70">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/50">Band Contact</p>
          <p className="font-semibold text-white">Paul Dolphin</p>
          <p>Exit Smiling</p>
          <p>
            <a href="mailto:paul@pauldolphindesigns.com.au" className="hover:text-white">
              paul@pauldolphindesigns.com.au
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3 text-white/70 md:justify-start xl:justify-end">
          <a href="https://www.instagram.com/exitsmiling33/" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialButtonClass}>
            <InstagramIcon className="h-4 w-4" />
          </a>

          <a href="https://www.facebook.com/profile.php?id=61584318366927" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialButtonClass}>
            <FacebookIcon className="h-4 w-4" />
          </a>

          <a href="https://www.youtube.com/@ExitSmiling-u8i" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialButtonClass}>
            <YoutubeIcon className="h-4 w-4" />
          </a>

          <a href="#" aria-label="Spotify" className={socialButtonClass}>
            <SiSpotify className="h-4 w-4" />
          </a>

          <a href="#" aria-label="Apple Music" className={socialButtonClass}>
            <SiApplemusic className="h-4 w-4" />
          </a>

          <a href="https://www.tiktok.com/@exit_smiling" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialButtonClass}>
            <TikTokIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function MobileSocialBar() {
  const socialButtonClass = 'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur transition duration-300 hover:border-white/35 hover:bg-white/10 hover:text-white';

  return (
    <div className="fixed right-3 top-1/2 z-50 -translate-y-1/2 md:hidden">
      <div className="flex flex-col items-center justify-center gap-2 rounded-full border border-white/10 bg-black/55 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        <a
          href="https://www.instagram.com/exitsmiling33/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className={socialButtonClass}
        >
          <InstagramIcon className="h-5 w-5" />
        </a>

        <a
          href="https://www.facebook.com/profile.php?id=61584318366927"
          target="_blank"
          rel="noreferrer"
          aria-label="Facebook"
          className={socialButtonClass}
        >
          <FacebookIcon className="h-5 w-5" />
        </a>

        <a
          href="https://www.youtube.com/@ExitSmiling-u8i"
          target="_blank"
          rel="noreferrer"
          aria-label="YouTube"
          className={socialButtonClass}
        >
          <YoutubeIcon className="h-5 w-5" />
        </a>

        <a
          href="#"
          aria-label="Spotify"
          className={socialButtonClass}
        >
          <SiSpotify className="h-5 w-5" />
        </a>

        <a
          href="#"
          aria-label="Apple Music"
          className={socialButtonClass}
        >
          <SiApplemusic className="h-5 w-5" />
        </a>

        <a
          href="https://www.tiktok.com/@exit_smiling"
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
          className={socialButtonClass}
        >
          <TikTokIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}

function VideoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        onClose?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-7xl px-4 md:px-8">
        <a
          href="https://www.youtube.com/watch?v=nlqhNT8FOuk"
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
          className="absolute -top-10 left-0 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70"
        >
          Watch on YouTube
        </a>
        <button onClick={onClose} className="absolute -top-10 right-0 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70">Close</button>
        <iframe
          src="https://www.youtube-nocookie.com/embed/nlqhNT8FOuk?autoplay=1&rel=0"
          title="Bombtrack RATM Cover by Exit Smiling"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full rounded-2xl bg-black"
        />
      </div>
    </div>
  );
}

function PosterModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-5xl">
        <button onClick={onClose} className="absolute -top-10 right-0 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70">Close</button>
        <div className="flex items-center justify-center rounded-2xl bg-black p-4 md:p-8">
          <img src="https://exit-smiling-media.bennoclark.workers.dev/merch/signed-poster-band-at-twilight.png" alt="Signed Poster enlarged" decoding="async" className="max-h-[85vh] w-auto max-w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function FeaturedAudioImageModal({ item, onClose }) {
  useEffect(() => {
    if (!item?.youtubeId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        onClose?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [item?.youtubeId, onClose]);

  if (!item?.image) return null;
  return (
    <div className="fixed inset-0 z-[102] flex items-center justify-center bg-black/92 p-4" onClick={onClose}>
      <div className="relative w-full max-w-6xl">
        <button onClick={onClose} className="absolute -top-10 right-0 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70">Close</button>
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-black p-4 md:p-6">
          <img
            src={item.image}
            alt={item.title || "Featured content enlarged"}
            decoding="async"
            className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain"
          />
        </div>
        {item.youtubeId ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0`}
              title={item.youtubeTitle || item.title || "Featured audio"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video w-full bg-black"
            />
          </div>
        ) : item.audio ? (
          <audio src={item.audio} autoPlay controls className="mt-4 w-full" />
        ) : null}
      </div>
    </div>
  );
}

function ReleasePreviewModal({ video, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!video || !element) return;

    const preview = typeof video === "string" ? { src: video } : video;
    const startAt = Number(preview.startAt || 0);
    const endAt = Number(preview.endAt || 0);

    const handleLoadedMetadata = () => {
      if (startAt > 0) {
        element.currentTime = startAt;
      }
      if (endAt > 0) {
        element.currentTime = startAt;
      }
      element.play().catch(() => {});
    };

    const handleTimeUpdate = () => {
      if (endAt > 0 && element.currentTime >= endAt) {
        element.pause();
        if (startAt > 0) {
          element.currentTime = startAt;
        }
      }
    };

    element.addEventListener("loadedmetadata", handleLoadedMetadata);
    element.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      element.pause();
      element.currentTime = 0;
      element.removeEventListener("loadedmetadata", handleLoadedMetadata);
      element.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [video]);

  if (!video) return null;

  const preview = typeof video === "string" ? { src: video } : video;
  return (
    <div className="fixed inset-0 z-[103] flex items-center justify-center bg-black/92 p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70">Close</button>
        <div className="rounded-3xl border border-white/10 bg-black p-3 md:p-5">
          <video
            ref={videoRef}
            src={preview.src}
            controls
            autoPlay
            className="max-h-[85vh] w-full rounded-2xl bg-black"
          />
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/65 md:text-sm">
            {preview.disclaimer || "LIVE PREVIEW - OFFICIAL MASTERED SINGLE COMING SOON"}
          </p>
        </div>
      </div>
    </div>
  );
}

function MerchImageModal({ open, onClose, image, title }) {
  if (!open || !image) return null;

  const useStaticLargeImage = image === exitSmilingDebutSingleCoverLarge;
  const merchPanelPositions = [
    '0% 0%',
    '33.333% 0%',
    '66.666% 0%',
    '100% 0%',
    '0% 100%',
    '33.333% 100%',
    '66.666% 100%',
    '100% 100%',
  ];

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/92 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-7xl">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-xl text-white hover:text-white/70"
        >
          Close
        </button>

        <div className="flex max-h-[90vh] items-center justify-center rounded-3xl border border-white/10 bg-[#0a0a0a] p-4 md:p-6">
          {useStaticLargeImage ? (
            <img
              src={image}
              alt={title || "Expanded merch image"}
              decoding="async"
              className="max-h-[88vh] w-auto max-w-[92vw] rounded-2xl border border-white/10 bg-black object-contain shadow-[0_0_60px_rgba(255,255,255,0.08)]"
            />
          ) : (
            <div className="relative aspect-[5/8] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black md:max-w-lg">
              {merchPanelPositions.map((position, index) => (
                <div
                  key={position}
                  className={`absolute inset-0 bg-no-repeat ${index === 0 ? 'opacity-100 animate-[merchPanelFadeFirst_17.3s_ease-in-out_infinite,merchPanelZoom_17.3s_ease-in-out_infinite]' : 'opacity-0 animate-[merchPanelFade_17.3s_ease-in-out_infinite,merchPanelZoom_17.3s_ease-in-out_infinite]'}`}
                  style={{
                    backgroundImage: `url(${image})`,
                    backgroundSize: '430% 214%',
                    backgroundPosition: position,
                    animationDelay: `${index * 2.16}s`,
                  }}
                  aria-hidden={index === 0 ? undefined : 'true'}
                  aria-label={index === 0 ? title : undefined}
                  role={index === 0 ? 'img' : undefined}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.28)_100%)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudioModal({
  open,
  onClose,
  authorized,
  email,
  setEmail,
  consentChecked,
  setConsentChecked,
  onSubmit,
  error,
  selectedStudioVideo,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/92 p-4">
      <div className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#090909] p-6 md:p-8">
        <button onClick={onClose} className="absolute right-5 top-5 text-white/70 hover:text-white">Close</button>
        {!authorized ? (
          <div className="mx-auto max-w-xl py-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.32em] text-yellow-300/70">Fan Updates</p>
            <h3 className="mt-4 text-3xl font-black uppercase">Unlock Studio Sessions</h3>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Enter your email and confirm you are happy to receive occasional Exit Smiling updates. This unlock stays available in this browser until site storage is cleared.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
              className="mt-6 space-y-4 text-left"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-full border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/30"
              />
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                />
                <span>I consent to receive Exit Smiling fan updates by email.</span>
              </label>
              <button type="submit" className="w-full rounded-full border border-yellow-300/45 bg-yellow-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:brightness-95">Unlock Videos</button>
            </form>
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            <p className="mt-4 text-xs leading-6 text-white/40">
              This is a frontend-only unlock for now. Email storage and encryption can be moved server-side later.
            </p>
          </div>
        ) : (
          <video src={selectedStudioVideo?.video} controls autoPlay poster={selectedStudioVideo?.thumb || ''} className="w-full rounded-2xl max-h-[85vh]" />
        )}
      </div>
    </div>
  );
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

function StripeShippingAddressElement({ shippingForm, setShippingForm, setAddressComplete }) {
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
        name: [shippingForm.first_name, shippingForm.last_name].filter(Boolean).join(" "),
        phone: shippingForm.phone || "",
        address: {
          line1: shippingForm.address_1 || "",
          line2: shippingForm.address_2 || "",
          city: shippingForm.city || "",
          state: shippingForm.province || "",
          postal_code: shippingForm.postal_code || "",
          country: (shippingForm.country_code || "au").toUpperCase(),
        },
      },
    }),
    []
  );

  return (
    <AddressElement
      options={addressOptions}
      onChange={(event) => {
        setAddressComplete(Boolean(event.complete));

        const value = event.value || {};
        const address = value.address || {};
        const nameParts = splitFullName(value.name);

        setShippingForm((prev) => ({
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

function MiniCart({
  open,
  cart,
  onClose,
  products,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  checkoutLoading,
  checkoutEmail,
  setCheckoutEmail,
  shippingForm,
  setShippingForm,
  shippingOptions,
  shippingLoading,
  shippingSaving,
  onSaveShippingDetails,
  addressComplete,
  setAddressComplete,
  onSelectShippingOption,
  checkoutError,
}) {
  const hasCompleteShippingForm =
    Boolean(shippingForm.first_name?.trim()) &&
    Boolean(shippingForm.last_name?.trim()) &&
    Boolean(shippingForm.address_1?.trim()) &&
    Boolean(shippingForm.city?.trim()) &&
    Boolean(shippingForm.province?.trim()) &&
    Boolean(shippingForm.postal_code?.trim()) &&
    String(shippingForm.country_code || "").toLowerCase() === "au";

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[115] bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      <div
        className={`fixed right-6 top-24 z-[120] w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl border border-white/10 bg-[#0b0b0b]/95 p-5 shadow-2xl backdrop-blur transition-all duration-300 ease-out ${open
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0 pointer-events-none"
          }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold uppercase">Your Cart</h3>
            <p className="text-sm text-white/50">
              {cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} item
              {(cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0) === 1 ? "" : "s"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white/70 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {cart?.items?.length ? (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-black">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/35">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold uppercase">{item.product_title || item.title}</p>

                  {(() => {
                    const normalize = (value) => String(value || "").trim().toLowerCase();

                    const fullVariant = products
                      ?.flatMap((product) => product.variants || [])
                      ?.find(
                        (variant) =>
                          variant.id === item.variant_id ||
                          variant.id === item.variant?.id
                      );

                    const optionMap = {};
                    fullVariant?.options?.forEach((opt) => {
                      const key = normalize(opt.option?.title || opt.option?.name);
                      if (key) optionMap[key] = opt.value;
                    });

                    const size = optionMap["size"] || null;
                    const fontColor =
                      optionMap["font color"] ||
                      optionMap["font colour"] ||
                      null;
                    const type = optionMap["type"] || null;
                    const rawInventoryQuantity = [
                      fullVariant?.inventory_quantity,
                      fullVariant?.stocked_quantity,
                      fullVariant?.available_quantity,
                    ].find((value) => value != null && !Number.isNaN(Number(value)));
                    const inventoryQuantity =
                      rawInventoryQuantity == null ? null : Number(rawInventoryQuantity);
                    const isPrintOnDemand =
                      Boolean(fullVariant?.allow_backorder) &&
                      inventoryQuantity != null &&
                      inventoryQuantity <= 0;

                    const pieces = [];
                    if (size) pieces.push(`Size: ${size}`);
                    if (fontColor) pieces.push(`Font: ${fontColor}`);
                    if (type) pieces.push(`Type: ${type}`);
                    if (isPrintOnDemand) pieces.push("Print on Demand = +7 days (+shipping)");

                    if (pieces.length) {
                      return (
                        <p className="mt-1 text-xs text-white/50">
                          {pieces.join(" - ")}
                        </p>
                      );
                    }

                    return item.variant_title ? (
                      <p className="mt-1 text-xs text-white/50">
                        {item.variant_title}
                      </p>
                    ) : null;
                  })()}

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      -
                    </button>

                    <span className="min-w-[24px] text-center text-sm text-white/80">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      +
                    </button>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="ml-auto rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-white/70">
                    ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/45">Your cart is empty.</p>
          )}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
            Shipping Details
          </h4>

          <div className="mt-3 space-y-3">
            <input
              type="email"
              value={checkoutEmail}
              onChange={(e) => setCheckoutEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
            />

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
                  <StripeShippingAddressElement
                    shippingForm={shippingForm}
                    setShippingForm={setShippingForm}
                    setAddressComplete={setAddressComplete}
                  />
                </Elements>
              </div>
            ) : (
              <p className="rounded-2xl border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">
                Stripe address entry is unavailable because the publishable key is missing.
              </p>
            )}

            <button
              onClick={onSaveShippingDetails}
              disabled={shippingSaving || (!addressComplete && !hasCompleteShippingForm)}
              className="w-full rounded-full border border-white/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {shippingSaving ? "Saving..." : "Confirm Shipping Details"}
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/80">
            Shipping Method
          </h4>

          {shippingLoading ? (
            <p className="mt-3 text-sm text-white/45">Loading shipping options...</p>
          ) : shippingOptions.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">
              Save shipping details to load shipping options.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {shippingOptions.map((option) => {
                const isSelected = option.isSelected;
                const amount = option.amount;

                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => onSelectShippingOption(option.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isSelected
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                      }`}
                  >
                    <span className="text-sm font-medium">{option.name || option.label || option.id}</span>
                    <span className="text-sm">
                      {amount != null ? `$${Number(amount).toFixed(2)}` : "Calculated"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-4 rounded-2xl border border-yellow-200/15 bg-yellow-200/8 p-3 text-[11px] leading-5 text-yellow-50/78">
            <p className="font-black uppercase tracking-[0.2em] text-yellow-50">Checkout notes</p>
            <p className="mt-2">
              Secure Stripe checkout. Apple Pay and Google Pay appear when supported by your device/browser. Print-on-demand items take about 7 extra days before shipping.
            </p>
          </div>
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="font-semibold text-white">
              ${cart?.subtotal != null ? Number(cart.subtotal).toFixed(2) : "0.00"}
            </span>
          </div>

          <button
            onClick={onCheckout}
            disabled={!cart?.items?.length || checkoutLoading}
            className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checkoutError ? (
              <p className="mb-4 text-sm text-red-400">{checkoutError}</p>
            ) : null}
            {checkoutLoading ? "Redirecting..." : "Checkout"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const studioAccessStorageKey = "exit_smiling_studio_access_token";
  const [previewAuthorized, setPreviewAuthorized] = useState(false);
  const [previewUserInput, setPreviewUserInput] = useState("");
  const [previewPasswordInput, setPreviewPasswordInput] = useState("");
  const [previewAccessError, setPreviewAccessError] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioAuthorized, setStudioAuthorized] = useState(false);
  const [studioEmail, setStudioEmail] = useState("");
  const [studioConsentChecked, setStudioConsentChecked] = useState(false);
  const [studioError, setStudioError] = useState('');
  const [selectedStudioVideo, setSelectedStudioVideo] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [heroSlideDurationMs, setHeroSlideDurationMs] = useState(defaultSlideDurationMs);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [merchImageOpen, setMerchImageOpen] = useState(false);
  const [selectedFeaturedAudioImage, setSelectedFeaturedAudioImage] = useState(null)
  const [releasePreviewVideo, setReleasePreviewVideo] = useState("");
  const [selectedMerchImage, setSelectedMerchImage] = useState("");
  const [selectedMerchTitle, setSelectedMerchTitle] = useState("");
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState(null);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [selectedOptionsByProduct, setSelectedOptionsByProduct] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState("");
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [shippingForm, setShippingForm] = useState({
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
  const [shippingAddressComplete, setShippingAddressComplete] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(previewAccessStorageKey) === "granted") {
      setPreviewAuthorized(true);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, heroImages[currentImage]?.type === "video" ? heroSlideDurationMs : defaultSlideDurationMs);
    return () => window.clearTimeout(timeout);
  }, [currentImage, heroSlideDurationMs]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true);
        setProductsError("");
        const data = await getProducts();
        setProducts(data);
        setSelectedOptionsByProduct({});
      } catch (err) {
        setProductsError(err?.message || "Failed to load merch.");
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function restoreStudioAccess() {
      try {
        const savedToken = localStorage.getItem(studioAccessStorageKey)
        if (!savedToken) return

        const verifiedAccess = await verifyFanUpdatesAccess(savedToken)

        if (verifiedAccess?.authorized && verifiedAccess?.email) {
          setStudioAuthorized(true)
          setStudioEmail(verifiedAccess.email)
          setStudioConsentChecked(true)
          return
        }
      } catch {
      }

      localStorage.removeItem(studioAccessStorageKey)
      setStudioAuthorized(false)
    }

    restoreStudioAccess()
  }, []);

  useEffect(() => {
    async function initCart() {
      try {
        const savedCartId = localStorage.getItem("exit_smiling_cart_id");

        if (savedCartId) {
          try {
            const existingCart = await getCart(savedCartId);

            const hasSucceededPaymentSession =
              existingCart?.payment_collection?.payment_sessions?.some(
                (session) =>
                  session?.status === "authorized" ||
                  session?.status === "captured" ||
                  session?.data?.payment_intent?.status === "succeeded"
              );

            if (!hasSucceededPaymentSession) {
              setCartId(existingCart.id);
              setCart(existingCart);
              return;
            }

            localStorage.removeItem("exit_smiling_cart_id");
          } catch (err) {
            localStorage.removeItem("exit_smiling_cart_id");
          }
        }

        const createdCart = await createCart();
        setCartId(createdCart.id);
        setCart(createdCart);
        localStorage.setItem("exit_smiling_cart_id", createdCart.id);
      } catch (err) {
      }
    }

    initCart();
  }, []);

  useEffect(() => {
    if (cartId) {
      loadShippingOptions(cartId);
    }
  }, [cartId]);

  useEffect(() => {
    function handleEsc(event) {
      if (event.key !== "Escape") return;

      if (stripeModalOpen) {
        setStripeModalOpen(false);
        return;
      }

      if (merchImageOpen) {
        setMerchImageOpen(false);
        return;
      }

      if (releasePreviewVideo) {
        setReleasePreviewVideo("");
        return;
      }

      if (selectedFeaturedAudioImage) {
        setSelectedFeaturedAudioImage(null);
        return;
      }

      if (studioOpen) {
        closeStudioModal();
        return;
      }

      if (posterOpen) {
        setPosterOpen(false);
        return;
      }

      if (videoOpen) {
        setVideoOpen(false);
        return;
      }

      setMiniCartOpen(false);
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [merchImageOpen, posterOpen, releasePreviewVideo, selectedFeaturedAudioImage, stripeModalOpen, studioOpen, videoOpen]);

  const handleStudioAccess = (video) => {
    setSelectedStudioVideo(video);
    setStudioOpen(true);
  };

  const submitStudioAccess = async () => {
    const normalizedEmail = studioEmail.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStudioError("Enter a valid email address");
      return;
    }

    if (!studioConsentChecked) {
      setStudioError("Consent is required to unlock Studio Sessions");
      return;
    }

    try {
      const access = await registerFanUpdatesAccess({
        email: normalizedEmail,
        consentChecked: true,
      })

      if (access?.token) {
        localStorage.setItem(studioAccessStorageKey, access.token)
      }

      setStudioEmail(access?.email || normalizedEmail)
      setStudioAuthorized(Boolean(access?.authorized))
      setStudioError("")
    } catch (err) {
      setStudioAuthorized(false)
      setStudioError(err.message || "Failed to unlock Studio Sessions")
    }
  };

  const closeStudioModal = () => {
    setStudioOpen(false);
    setStudioError('');
    setSelectedStudioVideo(null);
  };

  const refreshCartSafely = async (expectedMinItems = null) => {
    if (!cartId) return null;

    let lastCart = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      const latestCart = await getCart(cartId);
      lastCart = latestCart;

      const itemCount =
        latestCart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      if (expectedMinItems == null || itemCount >= expectedMinItems) {
        setCart(latestCart);
        return latestCart;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setCart(lastCart);
    return lastCart;
  };

  const refreshCartUntilShippingMethods = async (requiredOptionIds = []) => {
    if (!cartId) return null;

    const expectedIds = new Set((requiredOptionIds || []).filter(Boolean));
    let lastCart = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const latestCart = await getCart(cartId);
      lastCart = latestCart;

      const presentIds = new Set(
        (latestCart?.shipping_methods || [])
          .map((method) => method?.shipping_option_id || method?.shipping_option?.id)
          .filter(Boolean)
      );

      const hasAllRequiredIds =
        expectedIds.size === 0 ||
        Array.from(expectedIds).every((optionId) => presentIds.has(optionId));

      if (hasAllRequiredIds) {
        setCart(latestCart);
        return latestCart;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    setCart(lastCart);
    return lastCart;
  };

  const normalizeOptionKey = (value) =>
    String(value || "").trim().toLowerCase();

  const normalizeOptionValue = (value) =>
    String(value || "").trim().toLowerCase();

  const getVariantOptionMap = (variant) => {
    const map = {};

    variant?.options?.forEach((opt) => {
      const optionName = normalizeOptionKey(opt.option?.title || opt.option?.name);
      const optionValue = normalizeOptionValue(opt.value);

      if (optionName) {
        map[optionName] = optionValue;
      }
    });

    return map;
  };

  const findMatchingVariant = (product, selectedOptions) => {
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
      requiredOptionNames.length > 0 &&
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
  };

  const getSelectedShippingOptionIds = (activeCart) =>
    new Set(
      (activeCart?.shipping_methods || [])
        .map((method) => method.shipping_option_id || method.shipping_option?.id)
        .filter(Boolean)
    );

  const getActiveCartShippingProfileIds = (activeCart) => {
    const profileIds = new Set();

    for (const item of activeCart?.items || []) {
      const directProfileId =
        item?.variant?.product?.shipping_profile_id ||
        item?.variant?.product?.shipping_profile?.id;

      if (directProfileId) {
        profileIds.add(directProfileId);
        continue;
      }

      const variantId = item?.variant?.id;
      const productId = item?.variant?.product_id;
      const matchedProduct = products.find((product) => {
        if (productId && product.id === productId) return true;
        if (variantId && product.variants?.some((variant) => variant.id === variantId)) return true;
        return false;
      });

      const fallbackProfileId =
        matchedProduct?.shipping_profile_id || matchedProduct?.shipping_profile?.id;

      if (fallbackProfileId) {
        profileIds.add(fallbackProfileId);
      }
    }

    return profileIds;
  };

  const getCartItemWeight = (item) => {
    const directWeight = Number(
      item?.variant?.weight ??
      item?.variant?.product?.weight ??
      0
    );

    if (Number.isFinite(directWeight) && directWeight > 0) {
      return directWeight;
    }

    const variantId = item?.variant?.id;
    const productId = item?.variant?.product_id;
    const matchedProduct = products.find((product) => {
      if (productId && product.id === productId) return true;
      if (variantId && product.variants?.some((variant) => variant.id === variantId)) return true;
      return false;
    });

    const fallbackWeight = Number(
      matchedProduct?.weight ??
      matchedProduct?.variants?.find((variant) => variant.id === variantId)?.weight ??
      0
    );

    return Number.isFinite(fallbackWeight) ? fallbackWeight : 0;
  };

  const getCartShippingMode = (activeCart) => {
    const weights = (activeCart?.items || [])
      .map((item) => getCartItemWeight(item))
      .filter((weight) => weight > 0);

    if (!weights.length) return "unknown";

    const hasBulky = weights.some((weight) => weight >= 300);
    const hasLight = weights.some((weight) => weight > 0 && weight < 300);

    if (hasBulky && hasLight) return "mixed";
    if (hasBulky) return "bulky";
    return "light";
  };

  const getRelevantShippingProfileIdsFromOptions = (activeOptions, activeCart) => {
    const explicitProfileIds = getActiveCartShippingProfileIds(activeCart);
    if (explicitProfileIds.size) {
      return explicitProfileIds;
    }

    const mode = getCartShippingMode(activeCart);
    const profileGroups = new Map();

    for (const option of activeOptions || []) {
      const profileId = option?.shipping_profile_id || option?.shipping_profile?.id;
      if (!profileId) continue;

      if (!profileGroups.has(profileId)) {
        profileGroups.set(profileId, {
          profileId,
          total: 0,
          count: 0,
        });
      }

      const entry = profileGroups.get(profileId);
      const amount = getShippingOptionAmount(option);

      if (amount != null) {
        entry.total += Number(amount);
        entry.count += 1;
      }
    }

    const rankedProfiles = Array.from(profileGroups.values())
      .map((entry) => ({
        ...entry,
        average: entry.count ? entry.total / entry.count : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.average - b.average);

    if (mode === "light" && rankedProfiles.length) {
      return new Set([rankedProfiles[0].profileId]);
    }

    if (mode === "bulky" && rankedProfiles.length) {
      return new Set([rankedProfiles[rankedProfiles.length - 1].profileId]);
    }

    if (mode === "mixed") {
      return new Set(rankedProfiles.map((entry) => entry.profileId));
    }

    return new Set();
  };

  const getShippingOptionAmount = (option) =>
    option?.amount ??
    option?.price ??
    option?.calculated_price?.calculated_amount ??
    null;

  const getShippingOptionDisplayName = (option) => {
    const rawName = String(option?.name || option?.label || option?.id || "").trim();

    if (!rawName) return "";

    return rawName.replace(
      /\s*-\s*(light merch|bulky merch|default shipping profile)\s*$/i,
      ""
    );
  };

  const getGroupedShippingOptions = (activeOptions, activeCart) => {
    const selectedIds = getSelectedShippingOptionIds(activeCart);
    const activeProfileIds = getRelevantShippingProfileIdsFromOptions(activeOptions, activeCart);
    const cartShippingMode = getCartShippingMode(activeCart);
    const relevantOptions = (activeOptions || []).filter((option) => {
      if (!activeProfileIds.size) return true;

      const optionProfileId =
        option?.shipping_profile_id || option?.shipping_profile?.id;

      return !optionProfileId || activeProfileIds.has(optionProfileId);
    });
    const grouped = new Map();

    for (const option of relevantOptions) {
      const displayName = getShippingOptionDisplayName(option);
      const amount = getShippingOptionAmount(option);
      const key = displayName || option.id;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name: displayName || option.name || option.label || option.id,
          amount: 0,
          optionIds: [],
          isSelected: false,
          hasUnknownAmount: false,
        });
      }

      const entry = grouped.get(key);
      entry.optionIds.push(option.id);

      if (amount == null) {
        entry.hasUnknownAmount = true;
      } else {
        const numericAmount = Number(amount);

        if (cartShippingMode === "mixed") {
          entry.amount = Math.max(entry.amount, numericAmount);
        } else {
          entry.amount += numericAmount;
        }
      }

    }

    return Array.from(grouped.values()).map((entry) => {
      const requiredOptionIds = entry.optionIds.filter(Boolean);
      const isSelected =
        requiredOptionIds.length > 0 &&
        requiredOptionIds.every((optionId) => selectedIds.has(optionId));

      return {
        ...entry,
        amount: entry.hasUnknownAmount ? null : entry.amount,
        isSelected,
      };
    });
  };

  const getShippingSelectionError = (activeCart, activeOptions) => {
    if (!activeCart?.items?.length) return "";

    const hasCheckoutDetails =
      Boolean(activeCart?.email) &&
      Boolean(activeCart?.shipping_address?.address_1) &&
      Boolean(activeCart?.shipping_address?.country_code);

    if (!hasCheckoutDetails) {
      return "";
    }

    if (!activeOptions?.length) {
      return "Shipping options need to be refreshed for this cart. Please confirm shipping details again.";
    }

    const selectedIds = getSelectedShippingOptionIds(activeCart);

    if (!selectedIds.size) {
      return "Please select a shipping method before paying.";
    }

    const groupedOptions = getGroupedShippingOptions(activeOptions, activeCart);
    const hasFullySelectedGroupedOption = groupedOptions.some((option) => option.isSelected);

    if (!hasFullySelectedGroupedOption) {
      return "Cart contents changed. Please re-select your shipping method before paying.";
    }

    return "";
  };

  const handleAddToCart = async (productId) => {
    try {
      const product = products.find((p) => p.id === productId);

      if (!cartId) {
        return;
      }

      if (!product) {
        return;
      }

      const selectedOptions = selectedOptionsByProduct[productId] || {};
      const matchedVariant = findMatchingVariant(product, selectedOptions);

      if (!matchedVariant?.id) {
        alert("Please choose your merch type and size.");
        return;
      }

      await addLineItem(cartId, matchedVariant.id, 1, {
        selected_options: selectedOptions,
        size: selectedOptions["size"] || "",
        font_color:
          selectedOptions["font color"] ||
          selectedOptions["font colour"] ||
          "",
        type: selectedOptions["type"] || "",
      });

      const refreshedCart = await getCart(cartId);
      setCart(refreshedCart);
      setMiniCartOpen(true);

      try {
        await loadShippingOptions(cartId);
        setCheckoutError("");
      } catch {
      }
    } catch (err) {
    }
  };
  
  const handleUpdateQuantity = async (lineItemId, quantity) => {
    try {
      if (!cartId) return;

      if (quantity <= 0) {
        await removeLineItem(cartId, lineItemId);
      } else {
        await updateLineItem(cartId, lineItemId, quantity);
      }

      const refreshedCart = await refreshCartSafely();

      if (!refreshedCart?.items?.length) {
        setMiniCartOpen(false);
      } else {
        setMiniCartOpen(true);
      }

      try {
        await loadShippingOptions(cartId);
        setCheckoutError("");
      } catch {
      }
    } catch (err) {
    }
  };

  const handleRemoveItem = async (lineItemId) => {
    try {
      if (!cartId) return;

      await removeLineItem(cartId, lineItemId);

      const refreshedCart = await refreshCartSafely();

      if (!refreshedCart?.items?.length) {
        setMiniCartOpen(false);
      } else {
        setMiniCartOpen(true);
      }

      try {
        await loadShippingOptions(cartId);
        setCheckoutError("");
      } catch {
      }
    } catch (err) {
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutError("");

      if (!cart?.email) {
        setCheckoutError("Please enter your email and shipping details first.");
        return;
      }

      if (!cart?.shipping_methods?.length) {
        setCheckoutError("Please select a shipping method before paying.");
        return;
      }
      
      if (!cartId) {
        return;
      }

      if (checkoutLoading) return;
      setCheckoutLoading(true);

      const latestCart = await refreshCartSafely();
      const latestOptions = await loadShippingOptions(cartId);
      const shippingSelectionError = getShippingSelectionError(latestCart, latestOptions);

      if (shippingSelectionError) {
        setCheckoutError(shippingSelectionError);
        return;
      }

      const updatedCart = await initializeStripePayment(latestCart || cart);

      const session = updatedCart?.payment_collection?.payment_sessions?.find(
        (s) => s.provider_id === "pp_stripe_stripe"
      );

      const clientSecret =
        session?.data?.client_secret ||
        session?.data?.clientSecret ||
        "";

      if (!clientSecret) {
        setCheckoutLoading(false);
        return;
      }

      setCart(updatedCart);
      setStripeClientSecret(clientSecret);
      setStripeModalOpen(true);
    } catch (err) {
      setCheckoutError(err.message || "Failed to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const loadShippingOptions = async (activeCartId = cartId) => {
    try {
      if (!activeCartId) return [];

      setShippingLoading(true);

      const options = await listCartShippingOptions(activeCartId);
      setShippingOptions(options);

      return options;
    } catch (err) {
      setShippingOptions([]);
      return [];
    } finally {
      setShippingLoading(false);
    }
  };

  const handleSaveShippingDetails = async () => {
    try {
      if (!cartId) return;

      setShippingSaving(true);
      setCheckoutError("");

      const hasCompleteShippingForm =
        Boolean(checkoutEmail.trim()) &&
        Boolean(shippingForm.first_name.trim()) &&
        Boolean(shippingForm.last_name.trim()) &&
        Boolean(shippingForm.address_1.trim()) &&
        Boolean(shippingForm.city.trim()) &&
        Boolean(shippingForm.province.trim()) &&
        /^\d{4}$/.test(String(shippingForm.postal_code || "").trim()) &&
        String(shippingForm.country_code || "").toLowerCase() === "au";

      if (!hasCompleteShippingForm) {
        setCheckoutError("Please complete the Stripe shipping address before confirming.");
        return;
      }

      await updateCartDetails(cartId, {
        email: checkoutEmail.trim().toLowerCase(),
        shipping_address: {
          ...shippingForm,
          postal_code: String(shippingForm.postal_code || "").trim(),
          country_code: "au",
        },
        billing_address: {
          ...shippingForm,
          postal_code: String(shippingForm.postal_code || "").trim(),
          country_code: "au",
        },
      });

      const refreshedCart = await refreshCartSafely();

      await loadShippingOptions(cartId);
      setCheckoutError("");
    } catch (err) {
      setCheckoutError(err.message || "Failed to save shipping details.");
    } finally {
      setShippingSaving(false);
    }
  };

  const handleSelectShippingOption = async (groupId) => {
    try {
      if (!cartId) return;

      setCheckoutError("");
      const targetGroup = getGroupedShippingOptions(shippingOptions, cart).find(
        (option) => option.id === groupId
      );

      if (!targetGroup?.optionIds?.length) return;

      const desiredOptionIds = targetGroup.optionIds.filter(Boolean);

      await replaceShippingMethods(cartId, desiredOptionIds);

      const refreshedCart = await refreshCartUntilShippingMethods(desiredOptionIds);
      setCart(refreshedCart || cart);
      await loadShippingOptions(cartId);
      setCheckoutError("");
    } catch (err) {
      setCheckoutError(err.message || "Failed to select shipping option.");
    }
  };

  const handleStripeSuccess = async (order) => {
    localStorage.removeItem("exit_smiling_cart_id");
    setStripeModalOpen(false);
    setStripeClientSecret("");
    setMiniCartOpen(false);
    setCart(null);
    setCartId(null);

    try {
      const newCart = await createCart();
      setCartId(newCart.id);
      setCart(newCart);
      localStorage.setItem("exit_smiling_cart_id", newCart.id);
    } catch (err) {
    }

    navigate("/checkout/success");
  };

  const groupedShippingOptions = useMemo(
    () => getGroupedShippingOptions(shippingOptions, cart),
    [shippingOptions, cart]
  );

  const handlePreviewAccessSubmit = (event) => {
    event.preventDefault();

    if (
      previewUserInput.trim() === previewUsername &&
      previewPasswordInput === previewPassword
    ) {
      localStorage.setItem(previewAccessStorageKey, "granted");
      setPreviewAuthorized(true);
      setPreviewAccessError("");
      return;
    }

    setPreviewAccessError("Incorrect username or password.");
  };

  if (!previewAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(255,255,255,0.08)]">
            <div className="mb-6 text-center">
              <img src={brand.markLogo} alt={brand.logoAlt} decoding="async" className="mx-auto h-16 w-16 object-contain" />
              <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-white/45">Preview Access</p>
              <h1 className="mt-3 text-3xl font-black uppercase text-white">Exit Smiling</h1>
              <p className="mt-3 text-sm text-white/60">This preview is temporarily password protected.</p>
            </div>

            <form onSubmit={handlePreviewAccessSubmit} className="space-y-4">
              <input
                type="text"
                value={previewUserInput}
                onChange={(event) => setPreviewUserInput(event.target.value)}
                placeholder="Username"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <input
                type="password"
                value={previewPasswordInput}
                onChange={(event) => setPreviewPasswordInput(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              {previewAccessError ? (
                <p className="text-sm text-red-400">{previewAccessError}</p>
              ) : null}
              <button
                type="submit"
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:opacity-90"
              >
                Enter Site
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div id="top" className="min-h-screen bg-black pb-24 text-white selection:bg-white selection:text-black md:pb-0">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} } @keyframes livePulseZoom { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } } @keyframes liveHeadlinePulse { 0%, 100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(0.88); opacity: 0.86; } } @keyframes merchPanelFadeFirst { 0% { opacity: 1; } 8% { opacity: 1; } 15% { opacity: 0.22; } 21%, 100% { opacity: 0; } } @keyframes merchPanelFade { 0%, 4% { opacity: 0; } 10% { opacity: 0.18; } 16%, 19% { opacity: 1; } 25% { opacity: 0.18; } 31%, 100% { opacity: 0; } } @keyframes merchPanelZoom { 0%, 8% { transform: scale(1); } 18% { transform: scale(1.045); } 31%, 100% { transform: scale(1.05); } } @keyframes hoverImageCycle { 0%, 42% { opacity: 1; } 50%, 100% { opacity: 0; } } @keyframes sectionTitleGlow { 0%, 100% { opacity: 0.62; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.12); } } @keyframes sectionTitlePop { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,214,10,0.12)); } 50% { transform: scale(1.028); filter: drop-shadow(0 0 20px rgba(255,214,10,0.28)); } } @keyframes logoFloat { 0%, 12% { transform: translate3d(0px, 0px, 0) scale(1); } 30% { transform: translate3d(4px, -6px, 0) scale(1.01); } 54% { transform: translate3d(-3px, -2px, 0) scale(1.006); } 74% { transform: translate3d(5px, 4px, 0) scale(1.012); } 88%, 100% { transform: translate3d(0px, 0px, 0) scale(1); } } @keyframes logoLumaPulse { 0% { filter: brightness(0.92) drop-shadow(0 0 14px rgba(255,255,255,0.06)); } 50% { filter: brightness(1.14) drop-shadow(0 0 34px rgba(255,255,255,0.18)); } 100% { filter: brightness(0.92) drop-shadow(0 0 14px rgba(255,255,255,0.06)); } } @keyframes logoMorphWhite { 0%, 28% { opacity: 1; } 36%, 61% { opacity: 0; } 69%, 100% { opacity: 1; } } @keyframes logoMorphYellow { 0%, 28% { opacity: 0; } 36%, 61% { opacity: 1; } 69%, 100% { opacity: 0; } } @keyframes logoMorphBlack { 0%, 61% { opacity: 0; } 69%, 92% { opacity: 1; } 100% { opacity: 0; } } @keyframes logoGlitch { 0%, 22%, 26%, 100% { opacity: 0; transform: translate3d(0,0,0) skewX(0deg); clip-path: inset(0 0 0 0); filter: brightness(1); } 23% { opacity: 0.82; transform: translate3d(-3px, 1px, 0) skewX(-6deg); filter: brightness(1.45) drop-shadow(3px 0 0 rgba(255,255,255,0.24)) drop-shadow(-4px 0 0 rgba(153,200,255,0.24)); clip-path: inset(8% 0 52% 0); } 24% { opacity: 0.7; transform: translate3d(4px, -2px, 0) skewX(5deg); filter: brightness(0.68) drop-shadow(-3px 0 0 rgba(255,255,255,0.22)); clip-path: inset(48% 0 14% 0); } 25% { opacity: 0.58; transform: translate3d(-2px, 2px, 0) skewX(-3deg); filter: brightness(1.24) drop-shadow(0 0 20px rgba(255,255,255,0.24)); clip-path: inset(22% 0 30% 0); } } @keyframes logoGlowPulse { 0% { opacity: 0.38; transform: scale(0.98); } 50% { opacity: 0.72; transform: scale(1.03); } 100% { opacity: 0.38; transform: scale(0.98); } } @keyframes logoLightSweep { 0%, 18% { opacity: 0; transform: translateX(0) skewX(-12deg); } 28% { opacity: 0.9; } 42% { opacity: 0; transform: translateX(420%) skewX(-12deg); } 100% { opacity: 0; transform: translateX(420%) skewX(-12deg); } }`}</style>
      <Header
        cart={cart}
        onToggleMiniCart={() => setMiniCartOpen((prev) => !prev)}
      />
      <Hero
        currentImage={currentImage}
        onSlideDurationChange={setHeroSlideDurationMs}
        onOpenReleasePreview={setReleasePreviewVideo}
        onOpenHeroSingleImage={() => {
          setSelectedMerchImage(exitSmilingDebutSingleCoverLarge);
          setSelectedMerchTitle("Exit Smiling Debut Single");
          setMerchImageOpen(true);
        }}
      />
      <Releases onOpenReleasePreview={setReleasePreviewVideo} />
      <Gigs />
      <FeaturedContent
        onOpenVideo={() => setVideoOpen(true)}
        onOpenAudioImage={setSelectedFeaturedAudioImage}
        onOpenReleasePreview={setReleasePreviewVideo}
      />
      <StudioSessions onOpenStudio={handleStudioAccess} />
      <Band />
      <FanListSignup />
      <Store
        products={products}
        productsLoading={productsLoading}
        productsError={productsError}
        onAddToCart={handleAddToCart}
        onOpenMerchImage={(image, title) => {
          setSelectedMerchImage(image);
          setSelectedMerchTitle(title);
          setMerchImageOpen(true);
        }}
        selectedOptionsByProduct={selectedOptionsByProduct}
        setSelectedOptionsByProduct={setSelectedOptionsByProduct}
      />
      <PressKit />
      <MobileSocialBar />
      
      <Footer />
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      <PosterModal open={posterOpen} onClose={() => setPosterOpen(false)} />
      <MerchImageModal
        open={merchImageOpen}
        onClose={() => {
          setMerchImageOpen(false);
          setSelectedMerchImage("");
          setSelectedMerchTitle("");
        }}
        image={selectedMerchImage}
        title={selectedMerchTitle}
      />
      <StudioModal
        open={studioOpen}
        onClose={closeStudioModal}
        authorized={studioAuthorized}
        email={studioEmail}
        setEmail={setStudioEmail}
        consentChecked={studioConsentChecked}
        setConsentChecked={setStudioConsentChecked}
        onSubmit={submitStudioAccess}
        error={studioError}
        selectedStudioVideo={selectedStudioVideo}
      />
        <MiniCart
          open={miniCartOpen}
          cart={cart}
          products={products}
          onClose={() => setMiniCartOpen(false)}
          onCheckout={handleCheckout}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          checkoutLoading={checkoutLoading}
          checkoutEmail={checkoutEmail}
          setCheckoutEmail={setCheckoutEmail}
          shippingForm={shippingForm}
          setShippingForm={setShippingForm}
          shippingOptions={groupedShippingOptions}
          shippingLoading={shippingLoading}
          shippingSaving={shippingSaving}
          onSaveShippingDetails={handleSaveShippingDetails}
          addressComplete={shippingAddressComplete}
          setAddressComplete={setShippingAddressComplete}
          onSelectShippingOption={handleSelectShippingOption}
          checkoutError={checkoutError}
        />
      <StripeCheckoutModal
        open={stripeModalOpen}
        clientSecret={stripeClientSecret}
        cartId={cartId}
        onClose={() => {
          setStripeModalOpen(false);
          setStripeClientSecret("");
        }}
        onSuccess={handleStripeSuccess}
      />
      <FeaturedAudioImageModal
        item={selectedFeaturedAudioImage}
        onClose={() => setSelectedFeaturedAudioImage(null)}
      />
      <ReleasePreviewModal
        video={releasePreviewVideo}
        onClose={() => setReleasePreviewVideo("")}
      />
      
    </div>
  );
}

