import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dateLabelFromIso, getPublicGigs, hideGig, saveGig, uploadGigPoster } from "./gigAdminApi";
import { loginMemberMedia, prepareImageForUpload, readFileAsBase64 } from "./memberMediaApi";
import { memberNamesBySlug, memberSlugs } from "./memberBioMedia";

const memberOptions = Object.entries(memberSlugs).map(([name, slug]) => ({ name, slug }));
const maxSourcePosterBytes = 40 * 1024 * 1024;
const maxOptimizedPosterBytes = 8 * 1024 * 1024;
const defaultSiteGigs = [
  {
    id: "default-2026-04-18-battle-of-the-bands",
    dateIso: "2026-04-18",
    date: "APR 18",
    city: "Moruya, NSW",
    venue: "RSL Memorial Hall - 11 Page St, Moruya NSW 2537",
    time: "4PM-9PM AEST",
    note: "Currents: Battle of the Bands - Youth Week live music competition",
    source: "Built-in site gig",
  },
  {
    id: "default-2026-04-24-smokey-dans",
    dateIso: "2026-04-24",
    date: "APR 24",
    city: "Tomakin, NSW",
    venue: "Smokey Dan's",
    time: "Friday",
    note: "ARCHIE EP release tour",
    source: "Built-in site gig",
  },
  {
    id: "default-2026-05-02-narooma-oyster-festival",
    dateIso: "2026-05-02",
    date: "MAY 2",
    city: "Narooma, NSW",
    venue: "Narooma Oyster Festival",
    time: "1PM",
    note: "Live show",
    source: "Built-in site gig",
  },
  {
    id: "default-2026-05-16-oyster-cove",
    dateIso: "2026-05-16",
    date: "MAY 16",
    city: "Oyster Cove, NSW",
    venue: "Oyster Cove Cocktail Bar",
    time: "7PM",
    note: "Live show",
    source: "Built-in site gig",
  },
  {
    id: "default-2026-06-12-starfish-deli",
    dateIso: "2026-06-12",
    date: "JUN 12",
    city: "Batemans Bay, NSW",
    venue: "The Starfish Deli - Starfish Sessions (Upstairs)",
    time: "6:30PM-10PM AEST",
    note: "Debut single launch show",
    source: "Built-in site gig",
  },
  {
    id: "default-2026-06-21-moruya-sage-winter-festival",
    dateIso: "2026-06-21",
    date: "JUN 21",
    city: "Moruya, NSW",
    venue: "Moruya Sage Winter Festival - Moruya Riverside Park (TBD)",
    time: "Times TBD",
    note: "Live show",
    source: "Built-in site gig",
  },
];

function emptyGig() {
  return {
    dateIso: "",
    city: "",
    venue: "",
    time: "",
    note: "Live show",
    href: "",
    mapHref: "",
    ctaLabel: "",
    posterImage: "",
    disabledActions: false,
  };
}

function fieldClass() {
  return "rounded-2xl border border-white/12 bg-black/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-yellow-100/55";
}

export default function GigAdmin() {
  const [selectedMember, setSelectedMember] = useState("cadence");
  const [passcode, setPasscode] = useState("");
  const [token, setToken] = useState("");
  const [gigs, setGigs] = useState([]);
  const [hiddenDefaultGigIds, setHiddenDefaultGigIds] = useState([]);
  const [form, setForm] = useState(() => emptyGig());
  const [status, setStatus] = useState({ tone: "idle", message: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const memberName = memberNamesBySlug[selectedMember] || selectedMember;
  const isLoggedIn = Boolean(token);
  const visibleSiteGigs = useMemo(
    () =>
      [
        ...defaultSiteGigs.filter((gig) => !hiddenDefaultGigIds.includes(gig.id)),
        ...gigs.map((gig) => ({ ...gig, source: "Portal-added gig" })),
      ].sort((a, b) => String(a.dateIso).localeCompare(String(b.dateIso))),
    [gigs, hiddenDefaultGigIds],
  );

  useEffect(() => {
    let mounted = true;

    getPublicGigs()
      .then((data) => {
        if (!mounted) return;
        setGigs(data.gigs || []);
        setHiddenDefaultGigIds(data.hiddenDefaultGigIds || []);
      })
      .catch((error) => {
        if (!mounted) return;
        setStatus({ tone: "error", message: error.message || "Could not load current added gigs." });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const switchMember = (slug) => {
    setSelectedMember(slug);
    setPasscode("");
    setToken("");
    setStatus({ tone: "idle", message: "Enter this member's passcode to add or remove gigs." });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ tone: "pending", message: "Checking passcode..." });

    try {
      const result = await loginMemberMedia({ member: selectedMember, passcode });
      setToken(result.token);
      setStatus({ tone: "success", message: `Logged in as ${result.memberName || memberName}.` });
    } catch (error) {
      setToken("");
      setStatus({ tone: "error", message: error.message || "Login failed." });
    }
  };

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitGig = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus({ tone: "error", message: "Log in before adding a gig." });
      return;
    }

    setSaving(true);
    setStatus({ tone: "pending", message: "Saving gig..." });

    try {
      const result = await saveGig({
        token,
        member: selectedMember,
        gig: {
          ...form,
          date: dateLabelFromIso(form.dateIso),
        },
      });
      setGigs((result.gigs || []).filter((gig) => !gig.hidden));
      setHiddenDefaultGigIds(result.hiddenDefaultGigIds || []);
      setForm(emptyGig());
      setStatus({ tone: "success", message: "Gig saved. It will now appear in the public GIGS section." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const removeGig = async (id) => {
    if (!token) {
      setStatus({ tone: "error", message: "Log in before removing a gig." });
      return;
    }

    setStatus({ tone: "pending", message: "Removing gig..." });

    try {
      const result = await hideGig({ token, member: selectedMember, id });
      setGigs((result.gigs || []).filter((gig) => !gig.hidden));
      setHiddenDefaultGigIds(result.hiddenDefaultGigIds || []);
      setStatus({ tone: "success", message: "Gig removed from the public GIGS section." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Remove failed." });
    }
  };

  const uploadPoster = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!token) {
      setStatus({ tone: "error", message: "Log in before uploading a poster." });
      return;
    }
    if (file.size > maxSourcePosterBytes) {
      setStatus({ tone: "error", message: "Poster file is over 40MB. Use a smaller image." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", message: "Upload an image file for the gig poster." });
      return;
    }

    setUploadingPoster(true);
    setStatus({ tone: "pending", message: "Preparing poster image..." });

    try {
      const uploadFile = await prepareImageForUpload(file);

      if (uploadFile.size > maxOptimizedPosterBytes) {
        setStatus({ tone: "error", message: "Prepared poster is still too large. Try a smaller or simpler image." });
        return;
      }

      setStatus({ tone: "pending", message: "Uploading poster to R2..." });

      const dataBase64 = await readFileAsBase64(uploadFile);
      const result = await uploadGigPoster({ token, member: selectedMember, file: uploadFile, dataBase64 });
      updateForm("posterImage", result.url || "");
      setStatus({ tone: "success", message: "Poster uploaded. The Poster Image URL has been filled in." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Poster upload failed." });
    } finally {
      setUploadingPoster(false);
    }
  };

  const statusClass =
    status.tone === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-100"
      : status.tone === "success"
        ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
        : status.tone === "pending"
          ? "border-yellow-200/30 bg-yellow-200/10 text-yellow-50"
          : "border-white/10 bg-white/[0.035] text-white/60";

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-100/55">Exit Smiling</p>
            <h1 className="mt-2 text-3xl font-black uppercase md:text-5xl">Gig Admin</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Add confirmed future gigs to the public GIGS section. Use TBD text for unfinished details.
            </p>
          </div>
          <Link to="/" className="rounded-full border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-white/45 hover:text-white">
            Back to site
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_40px_rgba(255,255,255,0.05)] md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.24em] text-white/45">Band member</label>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 md:grid-cols-2">
                {memberOptions.map((member) => (
                  <button
                    key={member.slug}
                    type="button"
                    onClick={() => switchMember(member.slug)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                      selectedMember === member.slug
                        ? "border-yellow-100 bg-yellow-100 text-black"
                        : "border-white/10 bg-black/35 text-white/68 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <label className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                {memberName} passcode
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-100/60"
                  placeholder="Enter private passcode"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90"
                >
                  Log in
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/45">
                Any band member passcode can add a confirmed gig.
              </p>
            </form>
          </div>

          <div className={`mt-5 rounded-2xl border p-4 text-sm ${statusClass}`}>
            {status.message || "Log in to add or remove a gig."}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={submitGig} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
            <h2 className="text-2xl font-black uppercase">Add Future Gig</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Required: date, city, venue. Optional links can be added later by re-adding a corrected entry and removing the old one.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                Date
                <input
                  type="date"
                  value={form.dateIso}
                  onChange={(event) => updateForm("dateIso", event.target.value)}
                  className={fieldClass()}
                  required
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                City
                <input
                  value={form.city}
                  onChange={(event) => updateForm("city", event.target.value)}
                  className={fieldClass()}
                  placeholder="Batemans Bay, NSW"
                  required
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:col-span-2">
                Venue
                <input
                  value={form.venue}
                  onChange={(event) => updateForm("venue", event.target.value)}
                  className={fieldClass()}
                  placeholder="Venue name"
                  required
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                Time
                <input
                  value={form.time}
                  onChange={(event) => updateForm("time", event.target.value)}
                  className={fieldClass()}
                  placeholder="7PM / Times TBD"
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
                Button Text
                <input
                  value={form.ctaLabel}
                  onChange={(event) => updateForm("ctaLabel", event.target.value)}
                  className={fieldClass()}
                  placeholder="Tickets / Call to Book / Soon"
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:col-span-2">
                Note
                <input
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  className={fieldClass()}
                  placeholder="Single launch show"
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:col-span-2">
                Ticket / Booking URL
                <input
                  type="url"
                  value={form.href}
                  onChange={(event) => updateForm("href", event.target.value)}
                  className={fieldClass()}
                  placeholder="https://..."
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:col-span-2">
                Map URL
                <input
                  type="url"
                  value={form.mapHref}
                  onChange={(event) => updateForm("mapHref", event.target.value)}
                  className={fieldClass()}
                  placeholder="https://maps.app.goo.gl/..."
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/45 sm:col-span-2">
                Poster Image URL
                <input
                  type="url"
                  value={form.posterImage}
                  onChange={(event) => updateForm("posterImage", event.target.value)}
                  className={fieldClass()}
                  placeholder="Optional R2 image URL"
                  disabled={!isLoggedIn || saving}
                />
              </label>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Or upload poster image</p>
                <p className="mt-2 text-xs leading-5 text-white/42">
                  This optimises the image, uploads it to R2, then fills the Poster Image URL field above.
                </p>
                <label className={`mt-4 inline-flex cursor-pointer rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                  isLoggedIn && !saving && !uploadingPoster
                    ? "border-white/25 bg-white/8 text-white hover:border-white/50"
                    : "cursor-not-allowed border-white/10 text-white/30"
                }`}>
                  {uploadingPoster ? "Uploading..." : "Choose poster"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!isLoggedIn || saving || uploadingPoster}
                    onChange={uploadPoster}
                    className="hidden"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/65 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.disabledActions}
                  onChange={(event) => updateForm("disabledActions", event.target.checked)}
                  disabled={!isLoggedIn || saving}
                />
                Grey out Map/Tickets buttons for now
              </label>
            </div>

            <button
              type="submit"
              disabled={!isLoggedIn || saving}
              className="mt-5 w-full rounded-full bg-yellow-100 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {saving ? "Saving..." : "Add gig"}
            </button>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
            <h2 className="text-2xl font-black uppercase">Current Site Gigs</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              This includes built-in site gigs and portal-added gigs. Removing a built-in gig hides it from the public site.
            </p>
            <div className="mt-5 space-y-3">
              {visibleSiteGigs.length ? (
                visibleSiteGigs.map((gig) => (
                  <article key={gig.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-yellow-100/70">{gig.date}</p>
                    <h3 className="mt-2 text-base font-black uppercase text-white">{gig.city}</h3>
                    <p className="mt-1 text-sm text-white/60">{gig.venue}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">{gig.time} - {gig.note}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{gig.source}</p>
                    <button
                      type="button"
                      onClick={() => removeGig(gig.id)}
                      disabled={!isLoggedIn}
                      className="mt-4 rounded-full border border-red-300/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-100/80 transition hover:border-red-200/60 hover:text-red-50 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Remove from site
                    </button>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/45">
                  No visible gigs.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
