import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "./getProducts";
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
  addShippingMethod,
} from "./cart";
import { registerFanUpdatesAccess, verifyFanUpdatesAccess } from "./fanUpdates";

const primaryLogo = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615239/copy_of_exitsmilinglogo-white-blackbackground_qzq2fa_c8b4fb.png';
const markLogo = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775614405/ExitSmilingLOGO-Yellow-TransparentBackground_ccivvd.png';
const heroLogoBlack = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775614404/ExitSmilingLOGO-Black-TransparentBackground_mnwlqy.png';
const heroLogoYellow = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775614405/ExitSmilingLOGO-Yellow-TransparentBackground_ccivvd.png';
const heroLogoWhite = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1776305886/copy_of_exitsmilinglogo-white-blackbackground_qzq2fa_c8b4fb.png';

const brand = {
  name: 'Exit Smiling',
  primaryLogo,
  markLogo,
  logoAlt: 'Exit Smiling official logo',
};

const defaultSlideDurationMs = 3000;
const heroImages = [
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615943/Exit_Smiling_-_01b_aiag6j.jpg', position: 'center' },
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615939/Exit_Smiling_-_03_kbggnz.jpg', position: 'center' },
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615934/Exit_Smiling_-_05_avhs0w.jpg', position: 'center' },
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_02_jp3xuz.jpg', position: 'center' },
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_05b_ika3gn.jpg', position: 'center' },
  { type: 'image', src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777178649/band_bio_2_zy1uqv.jpg', position: 'center' },
];

const tourDates = [
  {
    date: 'APR 18',
    city: 'Moruya, NSW',
    venue: 'RSL Memorial Hall · 11 Page St, Moruya NSW 2537',
    time: '4PM–9PM AEST',
    href: 'https://www.eventbrite.com/e/currents-battle-of-the-bands-2026-live-youth-music-event-tickets-1981828560574',
    mapHref: 'https://maps.app.goo.gl/mTMXRXCejsmioYwb6',
    posterImage: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777242237/BOBS_q8x6y3.jpg',
    note: 'Currents: Battle of the Bands · Youth Week live music competition · Free event · Pizza, DJs, chill out spaces',
  },
  {
    date: 'APR 24',
    city: 'Tomakin, NSW',
    venue: 'Smokey Dan’s',
    time: 'Friday',
    href: 'https://events.humanitix.com/archie-at-smokey-dans-426/tickets?fbclid=IwY2xjawRKMDpleHRuA2FlbQIxMABicmlkETFGbmJIM3pkNXlDdklmWW9Vc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHin3kekDUp3KtzaNksuoRsJnoFDcdMcTgyPg986XG8ra6T20ev90Sl4nB4Gn_aem_7D5dBKgOLCSFaAtC_kBKjA',
    mapHref: 'https://maps.app.goo.gl/5GcQGcPbFMi9R5Rx8',
    posterImage: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777225102/678288251_1559201329546195_9058621081292561778_n_dkblaj.jpg',
    note: 'ARCHIE EP release tour (Together Apart) · with Grace Faletoese + Exit Smiling',
  },
  {
    date: 'MAY 2',
    city: 'Narooma, NSW',
    venue: 'Narooma Oyster Festival',
    time: '1PM',
    href: 'https://events.humanitix.com/narooma-oyster-festival-2026/tickets',
    mapHref: 'https://maps.app.goo.gl/L6tbtCGbjuTXrXi79',
    posterImage: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777244900/Naroomaoysterfestivalexitsmilinggigposter_anrfip.png',
    note: 'Live show',
  },
  {
    date: 'MAY 16',
    city: 'Oyster Cove, NSW',
    venue: 'Oyster Cove Cocktail Bar',
    time: '7PM',
    href: '#',
    mapHref: 'https://maps.app.goo.gl/Ex1Qa4t2vH4ysSQP6',
    posterImage: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777245825/oystercovegigposter_uxbdpg.png',
    note: 'Live show',
  },
  {
    date: 'JUN 12',
    city: 'Batemans Bay, NSW',
    venue: 'The Starfish Deli - Starfish Sessions (Upstairs)',
    time: '6:30PM–10PM AEST',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    mapHref: 'https://maps.app.goo.gl/7i9yxXRrR6kNqKd49',
    posterImage: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777272233/starfishdeli_gig_poster_2_gz3yyv.png',
    note: 'Debut single launch show',
  },
];

const videos = [
  { title: 'Latest Single', label: 'Official Video' },
  { title: 'Live Session', label: 'Behind the Scenes' },
  { title: 'Studio Cut', label: 'Visualiser' },
];

const pastGigPosterImages = [
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1777225190/IMG_0835_b1otk4.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1777225147/archie_smokey_dans_nknyj5.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1777225102/678288251_1559201329546195_9058621081292561778_n_dkblaj.jpg",
  "https://res.cloudinary.com/dkffwzpba/image/upload/v1777225092/545094081_1354974783302185_1251938289003598998_n_nqn2or.jpg",
];

const releases = [
  {
    title: 'Debut Single - Exit Smiling',
    meta: 'Single • Releases Friday June 12, 2026',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    blurb: 'Launching live at Starfish Sessions in Batemans Bay.',
    image: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1776054716/exit_smiling_cover_rounded_yktcc1.png',
    imageAlt: 'Exit Smiling Debut Single',
  },
  {
    title: 'Lost In You',
    meta: 'Single • 2026',
    href: '#',
    blurb: 'Next single release.',
    image: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1776055890/Lost_in_space_found_in_you_nudvc3.png',
    imageAlt: 'Lost In You Single',
  },
  {
    title: 'Home Town Hero',
    meta: 'Single • TBD',
    href: '#',
    blurb: 'TBD single release.',
    image: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777273781/hometwonhero_flzp8o.png',
    imageAlt: 'Home Town Hero',
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
    thumb: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1776205411/cadennceesversionnthumbnnail_stpw6w.png',
    video: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1776205381/cadenceESversion_idciep.mp4',
  },
  {
    title: 'Studio Session 02',
    subtitle: 'Private rough edit',
    thumb: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1776197355/lostinnnyouthumbnail_pecy9q.png',
    video: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1776197722/LIY_czohda.mp4',
  },
];

function Header({ cart, onToggleMiniCart }) {
  const socialButtonClass = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition duration-500 hover:border-white/35 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]';
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <a href="#top" className="flex items-center">
            <img src={brand.markLogo} alt={brand.logoAlt} className="h-16 w-16 object-contain md:h-20 md:w-20" />
            <span className="sr-only">{brand.name}</span>
          </a>
          <nav className="hidden gap-12 text-sm uppercase tracking-[0.2em] md:flex">
            {[
              { href: '#music', label: 'Music' },
              { href: '#tour', label: 'Gigs' },
              { href: '#videos', label: 'Videos' },
              { href: '#about', label: 'The Band' },
              { href: '#store', label: 'Merch' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="relative text-white/80 transition hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden items-center gap-3 md:flex">
            <a href="https://www.instagram.com/exitsmiling33/" target="_blank" rel="noreferrer" aria-label="Instagram" className={socialButtonClass}>
              <InstagramIcon className="h-4 w-4" />
            </a>

            <a href="https://www.facebook.com/profile.php?id=61584318366927" target="_blank" rel="noreferrer" aria-label="Facebook" className={socialButtonClass}>
              <FacebookIcon className="h-4 w-4" />
            </a>

            <a href="https://www.youtube.com/@exitsmiling-v8q/videos" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialButtonClass}>
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
          <a href="https://events.humanitix.com/exit-smiling/tickets" target="_blank" rel="noreferrer" className="rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-white hover:text-black">
            Get Tickets
          </a>
        </div>
      </div>
    </header>
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

function Hero({ currentImage, onSlideDurationChange }) {
  const currentHeroMedia = heroImages[currentImage];

  return (
    <section className="relative overflow-hidden border-b border-white/10">
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
                className="relative h-auto w-full object-contain opacity-95 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphWhite_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoYellow}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-auto w-full object-contain opacity-0 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphYellow_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoBlack}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-auto w-full object-contain opacity-0 animate-[logoLumaPulse_6.5s_ease-in-out_infinite,logoMorphBlack_16s_ease-in-out_infinite]"
              />
              <img
                src={heroLogoWhite}
                alt=""
                aria-hidden="true"
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
        </div>
        <div className="grid gap-4 self-end">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Featured release</p>
            <div className="group relative mt-4 aspect-square overflow-hidden rounded-2xl border border-white/10">
              <div
                className="absolute inset-0 transition duration-500 ease-out group-hover:scale-[1.02] filter grayscale contrast-110 brightness-105 group-hover:grayscale-0 group-hover:brightness-110"
                style={{
                  backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776054716/exit_smiling_cover_rounded_yktcc1.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 70%',
                }}
              />
              <div className="absolute inset-0 bg-black/20 transition duration-500 group-hover:opacity-0" />
              <div className="absolute inset-0 flex items-start justify-start p-6 md:p-8">
                <img src={brand.markLogo} alt={brand.logoAlt} className="h-auto w-[45%] max-w-[140px] object-contain opacity-95" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold uppercase">Debut Single</h2>
                <p className="text-sm text-white/60">Releases live on Friday June 12, 2026</p>
              </div>
              <a href="https://events.humanitix.com/exit-smiling/tickets" target="_blank" rel="noreferrer" className="rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">Listen</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Releases() {
  return (
    <section id="music" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <SectionTitle>Latest releases</SectionTitle>
        <a href="#" className="text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white">View all</a>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {releases.map((item) => {
          const parts = item.title.split(' - ');
          const hasSplit = parts.length > 1;
          const label = hasSplit ? parts[0] : null;
          const name = hasSplit ? parts.slice(1).join(' - ') : item.title;
          return (
            <article key={item.title} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="mb-3 h-5">{label && <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">{label}</p>}</div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  className="aspect-square w-full object-cover scale-[1.03] transition duration-500 ease-out filter contrast-110 brightness-105 group-hover:grayscale group-hover:brightness-95 group-hover:scale-[1.06]"
                />
              </div>
              <h3 className="mt-4 text-xl font-bold uppercase md:text-2xl">{name}</h3>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/50">{item.meta}</p>
              <p className="mt-3 text-sm leading-6 text-white/65">{item.blurb}</p>
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

            return (
            <div
              key={show.date + show.city}
              className={`group relative grid gap-4 px-5 py-5 transition duration-300 ease-out hover:z-10 hover:scale-[1.015] hover:bg-white/[0.08] hover:shadow-[0_0_36px_rgba(255,255,255,0.14)] md:grid-cols-[160px_1fr_auto] md:items-center ${index === 0 ? 'bg-white/5' : ''}`}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent opacity-0 transition duration-300 group-hover:border-white/30 group-hover:opacity-100" />
              {show.posterImage ? (
                <div className="pointer-events-none absolute right-[20%] top-1/2 z-20 hidden w-[min(240px,24vw)] -translate-y-1/2 translate-x-4 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 xl:block">
                  <div className="overflow-hidden rounded-3xl border border-white/12 bg-black/90 shadow-[0_0_34px_rgba(255,255,255,0.14)]">
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />
                    <img
                      src={show.posterImage}
                      alt={`${show.city} gig poster`}
                      className="aspect-[3/4] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                    />
                  </div>
                </div>
              ) : null}
              <div className="text-xl font-bold uppercase tracking-[0.2em] transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.22)]">{show.date}</div>
              <div>
                <div className="text-lg font-semibold uppercase transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_14px_rgba(255,255,255,0.18)]">{show.city}</div>
                <div className="text-sm text-white/60 transition duration-300 group-hover:text-white/80">{show.venue}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45 transition duration-300 group-hover:text-white/65">{show.time} · {show.note}</div>
                <div className="mt-3 flex max-h-0 items-center gap-2 overflow-hidden text-[10px] uppercase tracking-[0.24em] text-white/60 opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-white/25 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span className="text-white/72">{show.mapHref ? 'Venue map available' : 'Venue highlighted'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
                <a href={trimmedHref || '#'} target={hasTickets ? '_blank' : undefined} rel={hasTickets ? 'noreferrer' : undefined} className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black hover:border-white hover:bg-white hover:text-black">
                  {hasTickets ? 'Tickets' : 'Soon'}
                </a>
              </div>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}

function FeaturedContent({ onOpenVideo }) {
  return (
    <section id="videos" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <SectionTitle>Featured content</SectionTitle>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {videos.map((video, i) => (
          <article key={video.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_34px_rgba(255,255,255,0.1)]">
            {i === 0 ? (
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video bg-cover bg-center transition duration-500 ease-out group-hover:scale-[1.05] group-hover:brightness-110" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776054716/exit_smiling_cover_rounded_yktcc1.png')" }} />
              </div>
            ) : i === 1 ? (
              <div className="relative cursor-pointer overflow-hidden" onClick={onOpenVideo}>
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video w-full bg-cover bg-center transition duration-500 ease-out group-hover:scale-[1.05] group-hover:brightness-110" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776074427/Screenshot_2026-04-13_195808_ewpool.png')" }} />
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
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="aspect-video bg-gradient-to-br from-white/10 to-transparent transition duration-500 ease-out group-hover:scale-[1.04] group-hover:from-white/20" />
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

  return (
    <section id="store" className="scroll-mt-32 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-start justify-between gap-8">
          <div className="max-w-3xl">
            <SectionTitle>Merch</SectionTitle>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">
              All our band merch is currently lovingly hand screenprinted by the band to save waste, and all proceeds go toward our Japan Tour. We print in small on-demand batches and occasional one-offs. We print once weekly, so if your choice is not currently in inventory we will let you know the approximate print time.
            </p>
            <div
              className="group/merchvideo relative mt-5 inline-block"
              onMouseEnter={handleMerchPreviewEnter}
              onMouseLeave={handleMerchPreviewLeave}
            >
              <a
                href="https://res.cloudinary.com/dkffwzpba/video/upload/v1777165207/socials_professional_impact_720_lzrocb.mp4"
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/18 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-white/40 hover:bg-white/10 hover:text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
              >
                Behind the Scenes: Handmade Merch
              </a>
              <div className="pointer-events-none absolute left-0 top-full z-20 pt-4 opacity-0 transition duration-300 translate-y-2 group-hover/merchvideo:pointer-events-auto group-hover/merchvideo:translate-y-0 group-hover/merchvideo:opacity-100">
                <video
                  ref={merchPreviewVideoRef}
                  src="https://res.cloudinary.com/dkffwzpba/video/upload/v1777165207/socials_professional_impact_720_lzrocb.mp4"
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
              <div className="overflow-hidden rounded-[1.2rem]">
              <video
                src="https://res.cloudinary.com/dkffwzpba/video/upload/v1777258191/merch_rotation_woman_brpnmy.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(event) => {
                  event.currentTarget.currentTime = 0.75;
                  event.currentTarget.playbackRate = 0.625;
                }}
                className="block h-[280px] w-[160px] object-cover object-center [filter:contrast(1.08)_brightness(1.02)]"
                style={{ mixBlendMode: "screen" }}
              />
              </div>
              <div className="pointer-events-none absolute inset-x-4 bottom-5 z-20">
                <div className="rounded-full border border-yellow-300/30 bg-black/55 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.2)] backdrop-blur-sm animate-[liveHeadlinePulse_5.2s_ease-in-out_infinite]">
                  Most Popular
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products?.length === 0 && (
            <p className="text-white/50">Loading merch...</p>
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

            const image =
              product.thumbnail ||
              product.images?.[0]?.url ||
              "https://res.cloudinary.com/dkffwzpba/image/upload/v1776113173/Colorful__Exit_Smiling__T-shirts_display_j5gm3q.png";

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
                                {value}
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

                {price ? (
                  <p className="mt-3 text-center text-sm text-white/60">{price}</p>
                ) : (
                  <p className="mt-3 text-center text-sm text-white/35">
                    Select Type and Size to see price
                  </p>
                )}

                <button
                  onClick={() => onAddToCart(product.id)}
                  className="mt-4 w-full rounded-full border border-white/10 bg-zinc-800 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-zinc-700"
                >
                  Add to Cart
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
  const [isHoveringBioImage, setIsHoveringBioImage] = useState(false);
  const [hoverCycleKey, setHoverCycleKey] = useState(0);
  const imageClassName =
    "aspect-square w-full rounded-2xl border border-white/10 transition duration-500 ease-out group-hover:scale-[1.045] group-hover:brightness-110";
  const lighterSideImages =
    member.name === 'Max'
      ? [
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777173329/max_asleep_tht95m.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777223171/max_soccer_z1wxim.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777223763/max_logo_shirt_lvc2cy.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777246184/max_ski_gqtsvm.jpg',
            className: 'object-top',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777246858/max_team_labo_xxkzgc.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777247367/max_fishing_xqq7wb.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777247576/max_soccer_2_l8neun.jpg',
            className: '',
          },
          {
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777247857/max_fishing_2_uygwgl.jpg',
            className: '',
          },
        ]
      : member.name === 'Joey'
        ? [
            {
              src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777174022/joey_helmet_qu5nid.jpg',
              className: '',
            },
          ]
      : null;
  const hoverImageSegmentDuration = 3.15;
  const hoverImageCycleDuration = (lighterSideImages?.length || 1) * hoverImageSegmentDuration;
  const liveVideoRef = useRef(null);
  const bioClipVideoRef = useRef(null);
  const liveVideoFadeDuration = 0.6;
  const livePreview =
    member.name === 'Cadence'
      ? {
          src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777275358/cadence_1_ltneql.mp4',
          label: 'Everlong Cover - Cadence on vocals',
        }
      : member.name === 'Joey'
        ? {
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777152126/joey_bombtrack_fp1sz9.mp4',
            label: 'Joey on lead guitar',
          }
      : member.name === 'Lando'
        ? {
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777153684/lando_bombtrack_cuseb2.mp4',
            label: 'Lando on vocals',
          }
      : member.name === 'Julian'
        ? {
            src: null,
            label: 'Coming Soon',
          }
      : member.name === 'Max'
        ? {
            src: null,
            label: 'Coming Soon',
          }
      : null;
  const liveVideoSrc = livePreview?.src || null;
  const liveVideoTrimSeconds = member.name === 'Joey' ? 10 : 0;
  const liveVideoLabel = livePreview?.label || '';
  const liveClipVideo =
    liveVideoSrc
      ? {
          title: liveVideoLabel,
          src: liveVideoSrc,
        }
      : null;
  const memberAchievements =
    member.name === 'Joey'
      ? "Joey brings a wide mix of energy, discipline, and creativity to Exit Smiling. Outside the band, he has represented himself strongly across sport, leadership, and adventure. His background includes regional swimming, cross-country qualification, Nippers surf lifesaving, and serving as a school captain. He has been twin-tip skiing since he was two, was breakdancing at five, and is already part-way through his pilots licence training. That mix of movement, courage, focus, and creativity all feeds into the way he approaches guitar, performance, and life on stage."
      : member.name === 'Max'
        ? "Max brings a calm confidence and natural leadership to Exit Smiling. As the bands bass player, lyric writer, and oldest member, he helps anchor the group both musically and personally. His steady presence gives the younger members someone to look up to, while his songwriting and ideas help shape the bands sound and direction.\n\nAway from the stage, Max has always been active, curious, and quietly driven. He was school captain in Year 6, represented his school in cross country, and has played both club and representative soccer, often taking on the role of captain. He also loves mountain biking with his dad and has represented his school in MTB riding, bringing the same focus, balance, and determination to sport that he brings to music.\n\nMax learned to ski when he was 10 and has frothed on it ever since. He also learned to fish from his grandparents and still loves going out with them whenever he can. At different times he has been heavily into chess and tabletop gaming, although these days band life, school, sport, and bass practice do not leave much room for downtime.\n\nHe is also an avid reader and someone who thinks deeply about ideas, words, and stories - a quality that naturally feeds into his songwriting and lyrics. Whether he is locking in the groove on bass, helping shape a song, or offering quiet leadership behind the scenes, Max brings maturity, creativity, and a glimpse of the future for Exit Smiling."
      : null;
  const detailVideos =
    member.name === 'Joey'
      ? [
          {
            type: 'video',
            title: 'Joey Snow Grooming',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777252242/joeysnowcat_whfx9o.mp4',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_4/joeysnowcat_whfx9o.jpg',
          },
          {
            type: 'image',
            title: 'Pilot Training',
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777259171/joey_flying_wwqh15.jpg',
          },
          {
            type: 'image',
            title: 'Fender Tokyo',
            src: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1777259729/joey_fender_cxctl2.jpg',
          },
          {
            type: 'video',
            title: 'Joey Timber Sledding',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777260496/joey_ts_o6r3ma.mov',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/joey_ts_o6r3ma.jpg',
          },
          {
            type: 'video',
            title: 'Joey Wakesurfing',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777261582/joey_wakesurfing_nfxtqj.mov',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/joey_wakesurfing_nfxtqj.jpg',
            volume: 0.2,
          },
        ]
      : member.name === 'Max'
        ? [
            {
              type: 'video',
              title: 'Slip Sliding Away',
              src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777265239/max_waterslide_neqc0a.mp4',
              poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/max_waterslide_neqc0a.jpg',
            },
            {
              type: 'video',
              title: 'Tokyo Fender Shopping',
              src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777265240/max_fendertokyo_qodsws.mp4',
              poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/max_fendertokyo_qodsws.jpg',
            },
            {
              type: 'video',
              title: 'Black Hole Surfing',
              src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777265241/max_jamberoo_giorua.mp4',
              poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/max_jamberoo_giorua.jpg',
            },
          ]
      : [];
  const bioClipVideo =
    member.name === 'Cadence'
      ? {
          title: 'Cadence',
          src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777270913/cadence_bio_clip_sxvvyh.mp4',
          poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/cadence_bio_clip_sxvvyh.jpg',
        }
      : member.name === 'Joey'
      ? {
          title: 'Joey "Hendrix"',
          src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777253439/joey_hendrix_wj6jsu.mp4',
          poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/joey_hendrix_wj6jsu.jpg',
        }
      : member.name === 'Julian'
        ? {
            title: 'Julian "Grohl"',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777257286/JD_drums_bg1bg6.mp4',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/JD_drums_bg1bg6.jpg',
          }
      : member.name === 'Lando'
        ? {
            title: 'Lando "Osborne"',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777153684/lando_bombtrack_cuseb2.mp4',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/lando_bombtrack_cuseb2.jpg',
          }
      : member.name === 'Max'
        ? {
            title: 'Max "Commerford"',
            src: 'https://res.cloudinary.com/dkffwzpba/video/upload/v1777267831/max_bass_pedz6b.mp4',
            poster: 'https://res.cloudinary.com/dkffwzpba/video/upload/so_2/max_bass_pedz6b.jpg',
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
    if (!lighterSideImages?.length) return;

    setHoverCycleKey((prev) => prev + 1);
    setIsHoveringBioImage(true);
  };

  const handleBioImageLeave = () => {
    setIsHoveringBioImage(false);
  };

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

  return (
    <>
      <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_0_36px_rgba(255,255,255,0.1)]">
      <div
        className="relative mb-4 overflow-hidden rounded-2xl"
        onMouseEnter={handleBioImageEnter}
        onMouseLeave={handleBioImageLeave}
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.16),transparent_62%)] opacity-0 transition duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition duration-300 group-hover:opacity-40" />
        {member.name === 'Cadence' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775621525/Screenshot_2026-04-08_141112_q6uhq9.png" alt="Cadence" className={`${imageClassName} object-cover ${lighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Lando' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622141/Exit_Smiling_-_03b-lando_ynxwqw.jpg" alt="Lando" className={`${imageClassName} object-cover object-top ${lighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Julian' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622887/Exit_Smiling_-_03-julian_wxjhwb.jpg" alt="Julian" className={`${imageClassName} bg-black object-contain ${lighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Max' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775625733/copy_of_exit_smiling_-_live_photo_03_z80ybc_e8e030.jpg" alt="Max" className={`${imageClassName} object-cover ${lighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {member.name === 'Joey' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622030/Exit_Smiling_-_03b_yzf01a.jpg" alt="Joey" className={`${imageClassName} object-cover object-top ${lighterSideImages?.length ? "group-hover:opacity-0" : ""}`} /> : null}
        {lighterSideImages?.length ? (
          <>
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 shadow-[0_0_18px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                Off Stage
              </div>
            </div>
            {lighterSideImages.map((image, index) => (
              <img
                key={`${member.name}-off-stage-${index}-${hoverCycleKey}`}
                src={image.src}
                alt={`${member.name} off stage ${index + 1}`}
                className={`absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-500 ease-out [filter:contrast(1.08)_saturate(1.08)_brightness(1.02)] group-hover:scale-[1.12] ${lighterSideImages.length === 1 ? "group-hover:opacity-100" : ""} ${image.className}`}
                style={
                  lighterSideImages.length === 1 || !isHoveringBioImage
                    ? undefined
                    : {
                        animation: `hoverImageCycle ${hoverImageCycleDuration}s linear infinite`,
                        animationDelay: `${index * hoverImageSegmentDuration}s`,
                      }
                }
              />
            ))}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/52 via-black/8 to-black/18 opacity-0 transition duration-300 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.14),transparent_58%)]" />
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
          <p className="mt-3 text-sm text-white/70">Born and raised on the South Coast, Cadence’s passion for singing and music began at a young age, naturally guiding her into the creative young artist she is quickly becoming. At the age of 13 she joined the band that later became Exit Smiling, marking the beginning of her experience as a live performer and lead vocalist.</p>
          <p className="mt-3 text-sm text-white/70">Although still early in her formal training, Cadence began receiving professional vocal coaching in August 2025 from a renowned opera singer based in the UK. A blend of modern with classical training continues to refine her natural ability, further develop her technique, and support her growth as an emerging musician.</p>
        </>
      ) : member.name === 'Joey' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Joey is a 14-year-old lead guitarist bringing raw energy and a rapidly evolving sound to modern rock.</p>
          <p className="mt-3 text-sm text-white/70">Born in Niseko, Japan, Joey picked up his first right-handed acoustic guitar at just seven years old. After relocating to Australia in 2018, he made the switch to left-handed electric guitar, a transition that helped shape his distinctive playing style and musical identity.</p>
          <p className="mt-3 text-sm text-white/70">Drawing influence from a wide range of alternative, nu-metal, and hard rock artists, Joey’s playing blends tight, driving rhythm work with expressive lead lines. His approach is instinctive and feel-driven, always pushing beyond his years as he continues to develop both technically and creatively.</p>
          <p className="mt-3 text-sm text-white/70">As lead guitarist, Joey plays a key role in shaping the band’s sound, balancing melody, aggression, and tone across both live performances and original music.</p>
          <p className="mt-3 text-sm text-white/70">He is the proud caretaker of a growing guitar lineup, including a Fender Telecaster, Fender Stratocaster, and a Gibson SG, each contributing to his expanding tonal range. His guitar quiver reflects his music mentors: Tom Morello (RATM), Jimi Hendrix (The Hendrix Experience), and Tony Iommi (Black Sabbath).</p>
          <p className="mt-3 text-sm text-white/70">Still early in his journey, Joey is focused on writing, performing, and carving out his place in the next generation of rock musicians.</p>
        </>
      ) : member.name === 'Max' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Max is the Exit Smiling bassist and has loved it since it all began in Julian’s office, struggling through a 12-bar blues. Now he brings a funky, solid element to the band, both musically and socially, getting lost in jams with Julian, writing with the band, and heading out to switch off and have fun when he can (not too much fun).</p>
          <p className="mt-3 text-sm text-white/70">Max also enjoys mountain biking, skiing, hunting, and soccer, which he fuels with a lot of music, from shredding a pow day blasting Rage Against the Machine (not too loud, his parents don’t want him to damage his ears) to listening to Hilltop Hoods to focus before a game.</p>
          <p className="mt-3 text-sm text-white/70">Max has a very wide taste in music, with bands like Rage Against the Machine, Linkin Park, Black Sabbath, The Beatles, Audioslave, Hilltop Hoods, and Powderfinger forming the backbone of his influence. However, local influences such as the legendary Dave Berry and The Spindrift Saga have been just as important. He takes lessons from Dave Berry in practical elements, from setting up an overdrive pedal to understanding the genius of an AC/DC song, while members of The Spindrift Saga have taught him the cold, hard theory required to tackle a range of musical challenges, no matter how repetitive it may seem. These local legends give him and the band real insight into the music industry and how bands operate within it.</p>
          <p className="mt-3 text-sm text-white/70">Max is from the South Coast and brings a regional approach to problems, with a laid-back, fun-loving energy that is a core part of the band and a big reason why he and the others have formed such a strong bond.</p>
        </>
      ) : member.name === 'Julian' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Julian is 14 years old and was born in Manchester, UK, the heart of music in 90s England, where big bands like Oasis, The Smiths, and The Stone Roses came from. Julian moved to Australia when he was just 1 and started drumming at the age of 5. The first gig he watched was Henge in England in 2017. He also learned to play the piano through COVID and continues to grow his musical skill set beyond just rhythm.</p>
          <p className="mt-3 text-sm text-white/70">Julian’s main drumming influence comes from drummers such as Brad Wilks (RATM), Ringo Starr (The Beatles), and John Otto (Limp Bizkit). This influence brings a wide range of styles, such as hip hop, funk, and nu metal, into his drumming.</p>
          <p className="mt-3 text-sm text-white/70">Julian started writing and creating music with his younger brother during lockdown at age 10 and released a couple of music videos, which can still be tracked down on YouTube if you search hard enough. These videos gained enough attention to make it to the front page of the local paper, feature in The Canberra Times, and the boys were interviewed, with their songs played on ABC Radio.</p>
          <p className="mt-3 text-sm text-white/70">Julian has also competed and won the local St Cecilia Music Scholarships and competed with the top 20 drummers in Years 7–9 in NSW in the final of the OSIC drum competition. He has been taking lessons from one of Australia’s best jazz drummers, a former ANU drum teacher, using this to blend classical technique with more modern rock styles.</p>
          <p className="mt-3 text-sm text-white/70">Julian’s ambition would be to one day get sponsored by Heinz and Adidas, and he would like to receive unlimited free products from both companies.</p>
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
            className="aspect-video w-full object-cover transition duration-500 ease-out group-hover/bioclip:scale-[1.03] group-hover/bioclip:brightness-110"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-10">
            <p className="text-sm font-semibold uppercase text-white">{bioClipVideo.title}</p>
          </div>
        </button>
      ) : null}

      {memberAchievements ? (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="mt-5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition duration-300 hover:border-white/28 hover:bg-white/[0.08] hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
        >
          Not Just a Musician
        </button>
      ) : null}
      </div>

      {detailOpen && memberAchievements ? (
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
            <div className="mb-4 pr-24">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Video Clip</p>
              <h4 className="mt-2 text-2xl font-black uppercase text-white">{selectedBioClip.title}</h4>
            </div>
            <video
              src={selectedBioClip.src}
              poster={selectedBioClip.poster}
              controls
              autoPlay
              playsInline
              className="max-h-[78vh] w-full rounded-2xl bg-black object-contain"
            />
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
    "https://res.cloudinary.com/dkffwzpba/video/upload/so_4/band_bio_n5bkm7.jpg";
  const previewVideoSrc =
    "https://res.cloudinary.com/dkffwzpba/video/upload/v1777172335/band_bio_n5bkm7.mp4";

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
              Hover for audio • click to expand
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

function Band() {
  const bandBioImages = [
    {
      type: "image",
      src: "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_02_jp3xuz.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615934/Exit_Smiling_-_05_avhs0w.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615939/Exit_Smiling_-_03_kbggnz.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://res.cloudinary.com/dkffwzpba/image/upload/v1775615943/Exit_Smiling_-_01b_aiag6j.jpg",
      className: "grayscale group-hover/bandmoments:grayscale-0",
    },
    {
      type: "image",
      src: "https://res.cloudinary.com/dkffwzpba/image/upload/v1775625623/Exit_Smiling_-_Live_Photo_01_lj5nhg.jpg",
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

function StudioSessions({ onOpenStudio }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-10 border-t border-white/10 pt-20">
        <SectionTitle>Studio Sessions <span className="text-white/45">(Registered Fans)</span></SectionTitle>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">A private selection of rough studio-session edits. Join Fan Updates with your email and consent to unlock viewing in this browser.</p>
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
        <div className="flex items-center gap-3">
          <img src={brand.markLogo} alt={brand.logoAlt} className="h-8 w-8 rounded-full border border-white/10 object-cover" />
          <span>© 2026 {brand.name}</span>
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

          <a href="https://www.youtube.com/@exitsmiling-v8q/videos" target="_blank" rel="noreferrer" aria-label="YouTube" className={socialButtonClass}>
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
  const socialButtonClass = 'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition duration-300 hover:border-white/35 hover:bg-white/10 hover:text-white';

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-center gap-4">
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
          href="https://www.youtube.com/@exitsmiling-v8q/videos"
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="relative w-full max-w-7xl px-4 md:px-8">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white text-xl">✕</button>
        <video src="https://res.cloudinary.com/dkffwzpba/video/upload/v1776069327/bombtrack_4_xfxuvd.mp4" controls autoPlay className="w-full rounded-2xl max-h-[85vh] bg-black" />
      </div>
    </div>
  );
}

function PosterModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-5xl">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white text-xl">✕</button>
        <div className="flex items-center justify-center rounded-2xl bg-black p-4 md:p-8">
          <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1776116501/Exit_Smiling_band_at_twilight_n6dn9n.png" alt="Signed Poster enlarged" className="max-h-[85vh] w-auto max-w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function MerchImageModal({ open, onClose, image, title }) {
  if (!open || !image) return null;

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
          ✕
        </button>

        <div className="flex max-h-[90vh] items-center justify-center rounded-3xl border border-white/10 bg-[#0a0a0a] p-4 md:p-6">
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
        <button onClick={onClose} className="absolute right-5 top-5 text-white/70 hover:text-white">✕</button>
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
  onSelectShippingOption,
  checkoutError,
}) {
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
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
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

                    const pieces = [];
                    if (size) pieces.push(`Size: ${size}`);
                    if (fontColor) pieces.push(`Font: ${fontColor}`);
                    if (type) pieces.push(`Type: ${type}`);

                    if (pieces.length) {
                      return (
                        <p className="mt-1 text-xs text-white/50">
                          {pieces.join(" • ")}
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
                      −
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

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={shippingForm.first_name}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
                placeholder="First name"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <input
                type="text"
                value={shippingForm.last_name}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
                placeholder="Last name"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>

            <input
              type="text"
              value={shippingForm.address_1}
              onChange={(e) =>
                setShippingForm((prev) => ({ ...prev, address_1: e.target.value }))
              }
              placeholder="Street address"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={shippingForm.city}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <input
                type="text"
                value={shippingForm.province}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, province: e.target.value }))
                }
                placeholder="State"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={shippingForm.postal_code}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, postal_code: e.target.value }))
                }
                placeholder="Postcode"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <input
                type="text"
                value={shippingForm.phone}
                onChange={(e) =>
                  setShippingForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Phone"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
            </div>

            <button
              onClick={onSaveShippingDetails}
              disabled={shippingSaving}
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
                const isSelected = cart?.shipping_methods?.some(
                  (method) => method.shipping_option_id === option.id
                );

                const amount =
                  option.amount ??
                  option.price ??
                  option.calculated_price?.calculated_amount ??
                  null;

                return (
                  <button
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
  const [merchImageOpen, setMerchImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null)
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
    city: "",
    province: "",
    postal_code: "",
    country_code: "au",
    phone: "",
  });
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, heroImages[currentImage]?.type === "video" ? heroSlideDurationMs : defaultSlideDurationMs);
    return () => window.clearTimeout(timeout);
  }, [currentImage, heroSlideDurationMs]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
        setSelectedOptionsByProduct({});
      } catch (err) {
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
      if (event.key === "Escape") {
        setMiniCartOpen(false);
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

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
      }
    } catch (err) {
    }
  };

  const handleCheckout = async () => {
    try {
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

      const updatedCart = await initializeStripePayment(cart);

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

      const updatedCart = await updateCartDetails(cartId, {
        email: checkoutEmail,
        shipping_address: {
          ...shippingForm,
        },
        billing_address: {
          ...shippingForm,
        },
      });

      setCart(updatedCart);

      const options = await loadShippingOptions(cartId);
    } catch (err) {
      setCheckoutError(err.message || "Failed to save shipping details.");
    } finally {
      setShippingSaving(false);
    }
  };

  const handleSelectShippingOption = async (optionId) => {
    try {
      if (!cartId) return;

      setCheckoutError("");

      const updatedCart = await addShippingMethod(cartId, optionId);
      setCart(updatedCart);
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

    return (
    <div id="top" className="min-h-screen bg-black pb-24 text-white selection:bg-white selection:text-black md:pb-0">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} } @keyframes livePulseZoom { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } } @keyframes liveHeadlinePulse { 0%, 100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(0.88); opacity: 0.86; } } @keyframes merchPanelFadeFirst { 0% { opacity: 1; } 8% { opacity: 1; } 15% { opacity: 0.22; } 21%, 100% { opacity: 0; } } @keyframes merchPanelFade { 0%, 4% { opacity: 0; } 10% { opacity: 0.18; } 16%, 19% { opacity: 1; } 25% { opacity: 0.18; } 31%, 100% { opacity: 0; } } @keyframes merchPanelZoom { 0%, 8% { transform: scale(1); } 18% { transform: scale(1.045); } 31%, 100% { transform: scale(1.05); } } @keyframes hoverImageCycle { 0%, 42% { opacity: 1; } 50%, 100% { opacity: 0; } } @keyframes sectionTitleGlow { 0%, 100% { opacity: 0.62; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.12); } } @keyframes sectionTitlePop { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,214,10,0.12)); } 50% { transform: scale(1.028); filter: drop-shadow(0 0 20px rgba(255,214,10,0.28)); } } @keyframes logoFloat { 0%, 12% { transform: translate3d(0px, 0px, 0) scale(1); } 30% { transform: translate3d(4px, -6px, 0) scale(1.01); } 54% { transform: translate3d(-3px, -2px, 0) scale(1.006); } 74% { transform: translate3d(5px, 4px, 0) scale(1.012); } 88%, 100% { transform: translate3d(0px, 0px, 0) scale(1); } } @keyframes logoLumaPulse { 0% { filter: brightness(0.92) drop-shadow(0 0 14px rgba(255,255,255,0.06)); } 50% { filter: brightness(1.14) drop-shadow(0 0 34px rgba(255,255,255,0.18)); } 100% { filter: brightness(0.92) drop-shadow(0 0 14px rgba(255,255,255,0.06)); } } @keyframes logoMorphWhite { 0%, 28% { opacity: 1; } 36%, 61% { opacity: 0; } 69%, 100% { opacity: 1; } } @keyframes logoMorphYellow { 0%, 28% { opacity: 0; } 36%, 61% { opacity: 1; } 69%, 100% { opacity: 0; } } @keyframes logoMorphBlack { 0%, 61% { opacity: 0; } 69%, 92% { opacity: 1; } 100% { opacity: 0; } } @keyframes logoGlitch { 0%, 22%, 26%, 100% { opacity: 0; transform: translate3d(0,0,0) skewX(0deg); clip-path: inset(0 0 0 0); filter: brightness(1); } 23% { opacity: 0.82; transform: translate3d(-3px, 1px, 0) skewX(-6deg); filter: brightness(1.45) drop-shadow(3px 0 0 rgba(255,255,255,0.24)) drop-shadow(-4px 0 0 rgba(153,200,255,0.24)); clip-path: inset(8% 0 52% 0); } 24% { opacity: 0.7; transform: translate3d(4px, -2px, 0) skewX(5deg); filter: brightness(0.68) drop-shadow(-3px 0 0 rgba(255,255,255,0.22)); clip-path: inset(48% 0 14% 0); } 25% { opacity: 0.58; transform: translate3d(-2px, 2px, 0) skewX(-3deg); filter: brightness(1.24) drop-shadow(0 0 20px rgba(255,255,255,0.24)); clip-path: inset(22% 0 30% 0); } } @keyframes logoGlowPulse { 0% { opacity: 0.38; transform: scale(0.98); } 50% { opacity: 0.72; transform: scale(1.03); } 100% { opacity: 0.38; transform: scale(0.98); } } @keyframes logoLightSweep { 0%, 18% { opacity: 0; transform: translateX(0) skewX(-12deg); } 28% { opacity: 0.9; } 42% { opacity: 0; transform: translateX(420%) skewX(-12deg); } 100% { opacity: 0; transform: translateX(420%) skewX(-12deg); } }`}</style>
      <Header
        cart={cart}
        onToggleMiniCart={() => setMiniCartOpen((prev) => !prev)}
      />
      <Hero currentImage={currentImage} onSlideDurationChange={setHeroSlideDurationMs} />
      <Releases />
      <Gigs />
      <FeaturedContent onOpenVideo={() => setVideoOpen(true)} />
      <StudioSessions onOpenStudio={handleStudioAccess} />
      <Band />
      <Store
        products={products}
        onAddToCart={handleAddToCart}
        onOpenMerchImage={(image, title) => {
          setSelectedMerchImage(image);
          setSelectedMerchTitle(title);
          setMerchImageOpen(true);
        }}
        selectedOptionsByProduct={selectedOptionsByProduct}
        setSelectedOptionsByProduct={setSelectedOptionsByProduct}
      />
      
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
          shippingOptions={shippingOptions}
          shippingLoading={shippingLoading}
          shippingSaving={shippingSaving}
          onSaveShippingDetails={handleSaveShippingDetails}
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
        <MerchImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      
    </div>
  );
}


