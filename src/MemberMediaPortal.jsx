import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultMemberBioMedia,
  memberNamesBySlug,
  memberSlugs,
  mergeMemberBioMedia,
  normalizeMemberSlug,
} from "./memberBioMedia";
import {
  getPublicMemberMedia,
  loginMemberMedia,
  prepareImageForUpload,
  readFileAsBase64,
  saveMemberMedia,
  uploadMemberMedia,
} from "./memberMediaApi";

const memberOptions = Object.entries(memberSlugs).map(([name, slug]) => ({ name, slug }));
const maxSourceUploadBytes = 40 * 1024 * 1024;
const maxOptimizedUploadBytes = 8 * 1024 * 1024;

function getDefaultIds(slug) {
  return (defaultMemberBioMedia[slug] || []).map((item) => item.id);
}

function getInitialMedia(slug, overrides) {
  const existing = overrides?.[slug] || {};
  return {
    hiddenIds: Array.isArray(existing.hiddenIds) ? existing.hiddenIds : [],
    order: Array.isArray(existing.order) && existing.order.length ? existing.order : getDefaultIds(slug),
    customItems: Array.isArray(existing.customItems) ? existing.customItems : [],
  };
}

function moveItem(order, id, direction) {
  const index = order.indexOf(id);
  if (index < 0) return order;

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= order.length) return order;

  const next = [...order];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function MediaPreview({ item }) {
  const isVideo = item.type === "video" || /\.(mp4|mov)$/i.test(item.src || "");

  if (isVideo) {
    return (
      <video
        src={item.src}
        muted
        controls
        playsInline
        className="aspect-square w-full rounded-2xl bg-black object-cover"
      />
    );
  }

  return (
    <img
      src={item.src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`aspect-square w-full rounded-2xl bg-black object-cover ${item.className || ""}`}
    />
  );
}

export default function MemberMediaPortal() {
  const [selectedMember, setSelectedMember] = useState("cadence");
  const [passcode, setPasscode] = useState("");
  const [token, setToken] = useState("");
  const [overrides, setOverrides] = useState({});
  const [draft, setDraft] = useState(() => getInitialMedia("cadence", {}));
  const [status, setStatus] = useState({ tone: "idle", message: "" });
  const [uploading, setUploading] = useState(false);

  const memberName = memberNamesBySlug[selectedMember] || selectedMember;
  const isLoggedIn = Boolean(token);
  const allItems = useMemo(() => {
    if (!isLoggedIn) {
      return { visible: [], hidden: [] };
    }

    const visibleIds = new Set(draft.order || []);
    const customItems = draft.customItems || [];
    const defaults = defaultMemberBioMedia[selectedMember] || [];
    const merged = [...defaults, ...customItems];
    const draftOverrides = {
      [selectedMember]: draft,
    };
    const visible = mergeMemberBioMedia(selectedMember, draftOverrides);
    const hidden = merged.filter((item) => !visibleIds.has(item.id) || draft.hiddenIds.includes(item.id));

    return { visible, hidden };
  }, [draft, isLoggedIn, selectedMember]);

  useEffect(() => {
    let mounted = true;

    getPublicMemberMedia()
      .then((data) => {
        if (!mounted) return;
        const media = data?.media || {};
        setOverrides(media);
        setDraft(getInitialMedia(selectedMember, media));
      })
      .catch((error) => {
        if (!mounted) return;
        setStatus({ tone: "error", message: error.message || "Could not load current member media." });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const switchMember = (slug) => {
    setSelectedMember(slug);
    setToken("");
    setPasscode("");
    setDraft(getInitialMedia(slug, {}));
    setStatus({ tone: "idle", message: "Enter this member's passcode to view their media." });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ tone: "pending", message: "Checking passcode..." });

    try {
      const result = await loginMemberMedia({ member: selectedMember, passcode });
      setToken(result.token);
      setDraft(getInitialMedia(selectedMember, overrides));
      setStatus({ tone: "success", message: `Logged in as ${result.memberName || memberName}.` });
    } catch (error) {
      setToken("");
      setStatus({ tone: "error", message: error.message || "Login failed." });
    }
  };

  const updateDraft = (nextDraft) => {
    setDraft(nextDraft);
    setStatus({ tone: "idle", message: "" });
  };

  const hideItem = (id) => {
    updateDraft({
      ...draft,
      hiddenIds: Array.from(new Set([...(draft.hiddenIds || []), id])),
      order: (draft.order || []).filter((itemId) => itemId !== id),
    });
  };

  const showItem = (id) => {
    updateDraft({
      ...draft,
      hiddenIds: (draft.hiddenIds || []).filter((itemId) => itemId !== id),
      order: [...(draft.order || []), id],
    });
  };

  const removeCustomItem = (id) => {
    updateDraft({
      ...draft,
      customItems: (draft.customItems || []).filter((item) => item.id !== id),
      hiddenIds: (draft.hiddenIds || []).filter((itemId) => itemId !== id),
      order: (draft.order || []).filter((itemId) => itemId !== id),
    });
  };

  const save = async () => {
    if (!token) {
      setStatus({ tone: "error", message: "Log in before saving changes." });
      return;
    }

    setStatus({ tone: "pending", message: "Saving changes..." });

    try {
      const result = await saveMemberMedia({ token, member: selectedMember, media: draft });
      const nextOverrides = result.media || {};
      setOverrides(nextOverrides);
      setDraft(getInitialMedia(selectedMember, nextOverrides));
      setStatus({ tone: "success", message: "Saved. The public bio rotation will use these settings." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Save failed." });
    }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!token) {
      setStatus({ tone: "error", message: "Log in before uploading media." });
      return;
    }
    if (file.size > maxSourceUploadBytes) {
      setStatus({ tone: "error", message: "File is over 40MB. Use a smaller image." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", message: "Upload an image file for the bio rotation." });
      return;
    }

    setUploading(true);
    setStatus({ tone: "pending", message: "Preparing image for upload..." });

    try {
      const uploadFile = await prepareImageForUpload(file);

      if (uploadFile.size > maxOptimizedUploadBytes) {
        setStatus({ tone: "error", message: "Prepared image is still too large. Try a smaller or simpler image." });
        return;
      }

      setStatus({ tone: "pending", message: "Uploading optimized image to the media bucket..." });

      const dataBase64 = await readFileAsBase64(uploadFile);
      const result = await uploadMemberMedia({ token, member: selectedMember, file: uploadFile, dataBase64 });
      const item = result.item;
      const nextDraft = {
        ...draft,
        customItems: [...(draft.customItems || []), item],
        order: [...(draft.order || []), item.id],
      };
      setDraft(nextDraft);
      setStatus({ tone: "success", message: "Uploaded. Press Save Changes to publish this rotation update." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message || "Upload failed." });
    } finally {
      setUploading(false);
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
            <h1 className="mt-2 text-3xl font-black uppercase md:text-5xl">Band Bio Media Portal</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Manage your own bio rotation. Hide anything you do not want shown, upload new media, and save the order.
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
                Logged-in members can upload, hide, unhide, reorder, and save their own rotation.
              </p>
            </form>
          </div>

          <div className={`mt-5 rounded-2xl border p-4 text-sm ${statusClass}`}>
            {status.message || "No changes saved yet."}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.42fr]">
          <div>
            {isLoggedIn ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black uppercase">{memberName} live rotation</h2>
                    <p className="mt-1 text-sm text-white/50">These are the visible items, in display order.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                      token && !uploading
                        ? "border-white/25 bg-white/8 text-white hover:border-white/50"
                        : "cursor-not-allowed border-white/10 text-white/30"
                    }`}>
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!token || uploading}
                        onChange={upload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={save}
                      disabled={!token}
                      className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Save changes
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {allItems.visible.map((item, index) => (
                    <article key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-3">
                      <MediaPreview item={item} />
                      {item.credit ? (
                        <p className="mt-2 text-xs text-white/45">{item.credit}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateDraft({ ...draft, order: moveItem(draft.order || [], item.id, "up") })}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/35 hover:text-white"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft({ ...draft, order: moveItem(draft.order || [], item.id, "down") })}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/35 hover:text-white"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => hideItem(item.id)}
                          className="rounded-full border border-red-300/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-red-100/80 transition hover:border-red-200/60 hover:text-red-50"
                        >
                          Hide
                        </button>
                        {String(item.id).startsWith("custom:") ? (
                          <button
                            type="button"
                            onClick={() => removeCustomItem(item.id)}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:border-white/35 hover:text-white"
                          >
                            Remove upload
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs text-white/35">Position {index + 1}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-100/55">Private view</p>
                <h2 className="mt-3 text-3xl font-black uppercase">Log in as {memberName}</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55">
                  This member&apos;s media stays hidden until their passcode is entered.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            {isLoggedIn ? (
              <>
                <h2 className="text-xl font-black uppercase">Hidden items</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Hidden items are not deleted. They can be restored later.
                </p>
                <div className="mt-5 space-y-4">
                  {allItems.hidden.length ? (
                    allItems.hidden.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-black/35 p-3">
                        <MediaPreview item={item} />
                        <button
                          type="button"
                          onClick={() => showItem(item.id)}
                          className="mt-3 w-full rounded-full border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70 transition hover:border-white/45 hover:text-white"
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/45">
                      Nothing hidden for {memberName}.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-white/45">Hidden until login</p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Select a member and enter their passcode to view or edit their media.
                </p>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
