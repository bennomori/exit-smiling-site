import { useState, useEffect } from 'react';

const primaryLogo = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615239/copy_of_exitsmilinglogo-white-blackbackground_qzq2fa_c8b4fb.png';
const markLogo = 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775614405/ExitSmilingLOGO-Yellow-TransparentBackground_ccivvd.png';

const brand = {
  name: 'Exit Smiling',
  primaryLogo,
  markLogo,
  logoAlt: 'Exit Smiling official logo',
};

const heroImages = [
  { url: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615943/Exit_Smiling_-_01b_aiag6j.jpg', position: 'center' },
  { url: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615939/Exit_Smiling_-_03_kbggnz.jpg', position: 'center' },
  { url: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615934/Exit_Smiling_-_05_avhs0w.jpg', position: 'center' },
  { url: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_02_jp3xuz.jpg', position: 'center' },
  { url: 'https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_05b_ika3gn.jpg', position: 'center' },
];

const tourDates = [
  {
    date: 'APR 18',
    city: 'Moruya, NSW',
    venue: 'RSL Memorial Hall · 11 Page St, Moruya NSW 2537',
    time: '4PM–9PM AEST',
    href: 'https://www.eventbrite.com/e/currents-battle-of-the-bands-2026-live-youth-music-event-tickets-1981828560574',
    note: 'Currents: Battle of the Bands · Youth Week live music competition · Free event · Pizza, DJs, chill out spaces',
  },
  {
    date: 'APR 24',
    city: 'Tomakin, NSW',
    venue: 'Smokey Dan’s',
    time: 'Friday',
    href: 'https://events.humanitix.com/archie-at-smokey-dans-426/tickets?fbclid=IwY2xjawRKMDpleHRuA2FlbQIxMABicmlkETFGbmJIM3pkNXlDdklmWW9Vc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHin3kekDUp3KtzaNksuoRsJnoFDcdMcTgyPg986XG8ra6T20ev90Sl4nB4Gn_aem_7D5dBKgOLCSFaAtC_kBKjA',
    note: 'ARCHIE EP release tour (Together Apart) · with Grace Faletoese + Exit Smiling',
  },
  {
    date: 'MAY 16',
    city: 'Oyster Cove, NSW',
    venue: 'Oyster Cove Cocktail Bar',
    time: '7PM',
    href: '#',
    note: 'Live show',
  },
  {
    date: 'JUN 12',
    city: 'Batemans Bay, NSW',
    venue: 'The Starfish Deli - Starfish Sessions (Upstairs)',
    time: '6:30PM–10PM AEST',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    note: 'Debut single launch show',
  },
];

const videos = [
  { title: 'Latest Single', label: 'Official Video' },
  { title: 'Live Session', label: 'Behind the Scenes' },
  { title: 'Studio Cut', label: 'Visualiser' },
];

const releases = [
  {
    title: 'Debut Single - Exit Smiling',
    meta: 'Single • Releases Friday June 12, 2026',
    href: 'https://events.humanitix.com/exit-smiling/tickets',
    blurb: 'Launching live at Starfish Sessions in Batemans Bay.',
  },
  { title: 'Lost In You', meta: 'Single • 2026', href: '#', blurb: 'Next single release.' },
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

function SpotifyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 10.5c2.6-.7 5.4-.5 8 .8" />
      <path d="M8.7 13c2-.5 4.2-.3 6 .7" />
      <path d="M9.5 15.3c1.4-.3 3-.2 4.2.5" />
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

function AppleMusicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 5v10.2a2.8 2.8 0 1 1-2-2.68V7.2l6-1.2v8.2a2.8 2.8 0 1 1-2-2.68V5.4L15 5Z" />
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

function Header() {
  const socialButtonClass = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition duration-300 hover:border-white/35 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <a href="#top" className="flex items-center">
            <img src={brand.markLogo} alt={brand.logoAlt} className="h-16 w-16 object-contain md:h-20 md:w-20" />
            <span className="sr-only">{brand.name}</span>
          </a>
          <nav className="hidden gap-16 text-sm uppercase tracking-[0.2em] md:flex">
            {[
              { href: '#music', label: 'Music' },
              { href: '#tour', label: 'Gigs' },
              { href: '#videos', label: 'Videos' },
              { href: '#store', label: 'Store' },
              { href: '#about', label: 'About' },
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
              <SpotifyIcon className="h-4 w-4" />
            </a>

            <a href="#" aria-label="Apple Music" className={socialButtonClass}>
              <AppleMusicIcon className="h-4 w-4" />
            </a>

            <a href="https://www.tiktok.com/@exit_smiling" target="_blank" rel="noreferrer" aria-label="TikTok" className={socialButtonClass}>
              <TikTokIcon className="h-4 w-4" />
            </a>
          </div>

          <a href="https://events.humanitix.com/exit-smiling/tickets" target="_blank" rel="noreferrer" className="rounded-full border border-white px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:bg-white hover:text-black">
            Get Tickets
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ currentImage }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage: `url(${heroImages[currentImage].url})`,
          backgroundSize: 'cover',
          backgroundPosition: heroImages[currentImage].position,
          filter: 'grayscale(100%) contrast(110%) brightness(1.15)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.6),rgba(0,0,0,0.9))]" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-end gap-8 px-6 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <img src={brand.primaryLogo} alt={brand.logoAlt} className="mb-6 h-auto w-full max-w-[420px] object-contain opacity-95" />
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/60">Debut single releases Friday June 12, 2026</p>
          <h1 className="max-w-6xl text-5xl font-black uppercase leading-none md:text-7xl lg:text-8xl">Debut single launch live at Starfish Sessions.</h1>
          <p className="mt-6 max-w-2xl text-base text-white/70 md:text-lg">Exit Smiling launch their debut single on Friday, June 12, 2026 at Starfish Sessions (Upstairs) inside The Starfish Deli, Batemans Bay.</p>
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
        <h2 className="text-4xl font-black uppercase md:text-6xl">Latest releases</h2>
        <a href="#" className="text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white">View all</a>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {releases.map((item, idx) => {
          const parts = item.title.split(' - ');
          const hasSplit = parts.length > 1;
          const label = hasSplit ? parts[0] : null;
          const name = hasSplit ? parts.slice(1).join(' - ') : item.title;
          return (
            <article key={item.title} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">
              <div className="mb-3 h-5">{label && <p className="text-xs uppercase tracking-[0.35em] text-white/60">{label}</p>}</div>
              {idx === 0 ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1776054716/exit_smiling_cover_rounded_yktcc1.png" alt="Exit Smiling Debut Single" className="aspect-square w-full object-cover scale-[1.03] transition duration-500 ease-out filter contrast-110 brightness-105 group-hover:grayscale group-hover:brightness-95 group-hover:scale-[1.06]" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1776055890/Lost_in_space_found_in_you_nudvc3.png" alt="Lost In You Single" className="aspect-square w-full object-cover scale-[1.03] transition duration-500 ease-out filter contrast-110 brightness-105 group-hover:grayscale group-hover:brightness-95 group-hover:scale-[1.06]" />
                </div>
              )}
              <h3 className="mt-4 text-2xl font-bold uppercase">{name}</h3>
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
  return (
    <section id="tour" className="scroll-mt-32 border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-4xl font-black uppercase md:text-6xl">Gigs</h2>
        <div className="mt-10 divide-y divide-white/10 rounded-3xl border border-white/10">
          {tourDates.map((show, index) => (
            <div key={show.date + show.city} className={`grid gap-4 px-5 py-5 md:grid-cols-[160px_1fr_auto] md:items-center ${index === 0 ? 'bg-white/5' : ''}`}>
              <div className="text-xl font-bold uppercase tracking-[0.2em]">{show.date}</div>
              <div>
                <div className="text-lg font-semibold uppercase">{show.city}</div>
                <div className="text-sm text-white/60">{show.venue}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{show.time} · {show.note}</div>
              </div>
              <a href={show.href} target={show.href.startsWith('http') ? '_blank' : undefined} rel={show.href.startsWith('http') ? 'noreferrer' : undefined} className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-white hover:bg-white hover:text-black">
                {show.href.startsWith('http') ? 'Tickets' : 'Soon'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedContent({ onOpenVideo }) {
  return (
    <section id="videos" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <h2 className="text-4xl font-black uppercase md:text-6xl">Featured content</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {videos.map((video, i) => (
          <article key={video.title} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            {i === 0 ? (
              <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776054716/exit_smiling_cover_rounded_yktcc1.png')" }} />
            ) : i === 1 ? (
              <div className="relative cursor-pointer" onClick={onOpenVideo}>
                <div className="aspect-video w-full bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776074427/Screenshot_2026-04-13_195808_ewpool.png')" }} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="absolute bottom-4 left-4 text-left">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live</p>
                    <h4 className="text-lg font-bold uppercase">Bombtrack (RATM Cover)</h4>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white bg-black/30 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:bg-white/10 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.22)]">
                    <div className="ml-1 border-l-[10px] border-l-white border-y-[6px] border-y-transparent transition-transform duration-300 ease-out group-hover:translate-x-[1px]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-white/10 to-transparent" />
            )}
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{video.label}</p>
              <h3 className="mt-2 text-2xl font-bold uppercase">{video.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Store({ onOpenPoster }) {
  return (
    <section id="store" className="scroll-mt-32 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-4xl font-black uppercase md:text-6xl">Merch highlights</h2>
          <a href="#" className="text-sm uppercase tracking-[0.2em] text-white/70 hover:text-white">Shop all</a>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {merch.map((item, i) => (
            <article key={item} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black">
                {i === 0 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776113173/Colorful__Exit_Smiling__T-shirts_display_j5gm3q.png')" }} />}
                {i === 1 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776112855/Hoodies_with_bold__Exit_Smiling__prints_pmn1xn.png')" }} />}
                {i === 2 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776113807/Colorful_caps_with_bold_lettering_niddcc.png')" }} />}
                {i === 3 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776114137/Exit_Smiling_vinyl_bundle_showcase_zqn6qt.png')" }} />}
                {i === 4 && (
                  <button type="button" onClick={onOpenPoster} className="absolute inset-0 flex items-center justify-center bg-black p-4 text-left">
                    <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1776116501/Exit_Smiling_band_at_twilight_n6dn9n.png" alt="Signed Poster" className="max-h-full max-w-full object-contain" />
                  </button>
                )}
                {i === 5 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776130540/Black_guitar_pick_accessories_with_band_logo_ru6m8i.png')" }} />}
                {i === 6 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776123496/Exit_smiling_guitar_picks_detail_rx75ix.png')" }} />}
                {i === 7 && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/dkffwzpba/image/upload/v1776129975/Band_T-shirt_with_signatures_displayed_k7kna6.png')" }} />}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
                  <div className="rounded-full border border-white/40 bg-black/65 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm">Shop now</div>
                </div>
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold uppercase">{item}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ member }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      {member.name === 'Cadence' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775621525/Screenshot_2026-04-08_141112_q6uhq9.png" alt="Cadence" className="mb-4 aspect-square w-full rounded-2xl border border-white/10 object-cover" /> : null}
      {member.name === 'Lando' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622141/Exit_Smiling_-_03b-lando_ynxwqw.jpg" alt="Lando" className="mb-4 aspect-square w-full rounded-2xl border border-white/10 object-cover object-top" /> : null}
      {member.name === 'Julian' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622887/Exit_Smiling_-_03-julian_wxjhwb.jpg" alt="Julian" className="mb-4 aspect-square w-full rounded-2xl border border-white/10 bg-black object-contain" /> : null}
      {member.name === 'Max' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775625733/copy_of_exit_smiling_-_live_photo_03_z80ybc_e8e030.jpg" alt="Max" className="mb-4 aspect-square w-full rounded-2xl border border-white/10 object-cover" /> : null}
      {member.name === 'Joey' ? <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775622030/Exit_Smiling_-_03b_yzf01a.jpg" alt="Joey" className="mb-4 aspect-square w-full rounded-2xl border border-white/10 object-cover object-top" /> : null}

      <h3 className="text-xl font-bold uppercase">
        {member.name}
      </h3>

      <p className="mt-1 text-sm uppercase tracking-[0.2em] text-white/50">
        {member.role}
      </p>

      {member.name === 'Cadence' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Cadence is a young vocalist known for her powerful tone, wide range, and natural ability to adapt across a broad spectrum of musical styles. Her voice carries strength and emotion with dynamic versatility, leaving a lasting impact on her listeners.</p>
          <p className="mt-3 text-sm text-white/70">Cadence draws strong inspiration from iconic vocal artists such as Amy Lee of Evanescence and Emily Armstrong of Linkin Park, with these influences shaping her connection to a wide range of rock styles. However, her love of country, pop, and indie music follows closely behind, fuelling a musical journey that remains unconfined to any one genre, allowing her evolving skill to continually grow.</p>
          <p className="mt-3 text-sm text-white/70">Born and raised on the South Coast, Cadence’s passion for singing and music began at a young age, naturally guiding her into the creative young artist she is quickly becoming. At the age of 13 she joined the band that later became Exit Smiling, marking the beginning of her experience as a live performer and lead vocalist.</p>
          <p className="mt-3 text-sm text-white/70">Although still early in her formal training, Cadence began receiving professional vocal coaching in August 2025 from a renowned opera singer based in the UK. A blend of modern with classical training continues to refine her natural ability, further develop her technique, and support her growth as an emerging musician.</p>
        </>
      ) : member.name === 'Joey' ? (
        <>
          <p className="mt-3 text-sm text-white/70">Joey Clark-Mori is a 14-year-old lead guitarist bringing raw energy and a rapidly evolving sound to modern rock.</p>
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
          <p className="mt-3 text-sm text-white/70">Julian Dolphin is 14 years old and was born in Manchester, UK, the heart of music in 90s England, where big bands like Oasis, The Smiths, and The Stone Roses came from. Julian moved to Australia when he was just 1 and started drumming at the age of 5. The first gig he watched was Henge in England in 2017. He also learned to play the piano through COVID and continues to grow his musical skill set beyond just rhythm.</p>
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
    </div>
  );
}

function Band() {
  return (
    <section id="about" className="scroll-mt-32 mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12">
        <h2 className="text-4xl font-black uppercase md:text-6xl">The Band</h2>
      </div>
      <div className="mb-16 grid gap-10 md:grid-cols-2 md:items-start">
        <div className="max-w-3xl space-y-6 text-white/70">
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.1s', opacity: 0 }}>Exit Smiling are a band bonded by fish & chips and a shared sense of fun. The five-piece from Malua Bay and Broulee officially formed in November 2024 after meeting at a local take-away shop, where the idea of starting a band became too good to ignore. The lineup brings together Joey on guitar, Julian on drums, Lando on guitar and vocals, Max on bass, and Cadence on vocals. Each member brings their own background and creativity, from Julian’s award-winning musicianship and hip hop projects to Joey and Julian’s earlier filmmaking and songwriting adventures.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.25s', opacity: 0 }}>From the outset, Exit Smiling embraced a bold sound and playful spirit. Influenced by Rage Against the Machine, Limp Bizkit, the Beastie Boys, and The Beatles, they write collaboratively, blending riffs and grooves with lyrics pulled from both thrift shop finds and their sharp-eyed observations of the world around them. Their style is unapologetically loud, fun, and confident, resulting in a band that takes their music seriously while refusing to take themselves too seriously.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.4s', opacity: 0 }}>On stage, Exit Smiling thrive on energy and connection. Their rehearsals are chatty and buzzing, but their live performances are tight, engaging, and designed to leave the crowd doing exactly what their name promises. They have already made their mark at venues like Broulee Brewhouse and Starfish, won their school’s Battle of the Bands, and supported local heroes like Flavuh. Their biggest highlights so far include getting paid for their music, joining the Younite lineup, sharing stages with the bands they admire, and supporting popular artists Merci, Mercy and Thunderfox at a festival performance that cemented their growing reputation.</p>
          <p style={{ animation: 'fadeIn 0.8s ease forwards', animationDelay: '0.55s', opacity: 0 }}>Looking ahead, Exit Smiling are ambitious. Their short-term goals include recording a full album of originals, finding a manager or label, and building their presence as working musicians. Long term, they dream of collaborating with their inspirations and taking their music on international tours, with Europe, Canada, and Japan high on the wish list.</p>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <img src="https://res.cloudinary.com/dkffwzpba/image/upload/v1775615928/Exit_Smiling_-_05b_ika3gn.jpg" alt="Exit Smiling band" className="h-full w-full object-cover" />
          </div>
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
        <h2 className="text-4xl font-black uppercase md:text-6xl">Studio Sessions <span className="text-white/45">(Private)</span></h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">A private selection of rough studio-session edits for promoters and venue partners.</p>
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
            <SpotifyIcon className="h-4 w-4" />
          </a>

          <a href="#" aria-label="Apple Music" className={socialButtonClass}>
            <AppleMusicIcon className="h-4 w-4" />
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
          <SpotifyIcon className="h-5 w-5" />
        </a>

        <a
          href="#"
          aria-label="Apple Music"
          className={socialButtonClass}
        >
          <AppleMusicIcon className="h-5 w-5" />
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

function StudioModal({ open, onClose, authorized, password, setPassword, onSubmit, error, selectedStudioVideo }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/92 p-4">
      <div className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#090909] p-6 md:p-8">
        <button onClick={onClose} className="absolute right-5 top-5 text-white/70 hover:text-white">✕</button>
        {!authorized ? (
          <div className="mx-auto max-w-xl py-8 text-center">
            <h3 className="mt-4 text-3xl font-black uppercase">Studio Sessions</h3>
            <p className="mt-4 text-sm text-white/65">Enter password to view</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
              className="mt-6 flex gap-3"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2"
              />
              <button type="submit" className="rounded-full bg-white px-4 py-2 text-black">Enter</button>
            </form>
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          </div>
        ) : (
          <video src={selectedStudioVideo?.video} controls autoPlay poster={selectedStudioVideo?.thumb || ''} className="w-full rounded-2xl max-h-[85vh]" />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioAuthorized, setStudioAuthorized] = useState(false);
  const [studioPassword, setStudioPassword] = useState('');
  const [studioError, setStudioError] = useState('');
  const [selectedStudioVideo, setSelectedStudioVideo] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStudioAccess = (video) => {
    setSelectedStudioVideo(video);
    setStudioOpen(true);
  };

  const submitStudioPassword = () => {
    if (studioPassword.trim() === 'exitsmilingprivate') {
      setStudioAuthorized(true);
      setStudioError('');
      return;
    }
    setStudioError('Incorrect password');
  };

  const closeStudioModal = () => {
    setStudioOpen(false);
    setStudioAuthorized(false);
    setStudioPassword('');
    setStudioError('');
    setSelectedStudioVideo(null);
  };

  return (
    <div id="top" className="min-h-screen bg-black pb-24 text-white selection:bg-white selection:text-black md:pb-0">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
      <Header />
      <Hero currentImage={currentImage} />
      <Releases />
      <Gigs />
      <FeaturedContent onOpenVideo={() => setVideoOpen(true)} />
      <Store onOpenPoster={() => setPosterOpen(true)} />
      <Band />
      <StudioSessions onOpenStudio={handleStudioAccess} />
      <Footer />
      <MobileSocialBar />
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      <PosterModal open={posterOpen} onClose={() => setPosterOpen(false)} />
      <StudioModal
        open={studioOpen}
        onClose={closeStudioModal}
        authorized={studioAuthorized}
        password={studioPassword}
        setPassword={setStudioPassword}
        onSubmit={submitStudioPassword}
        error={studioError}
        selectedStudioVideo={selectedStudioVideo}
      />
    </div>
  );
}