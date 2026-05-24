import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultMemberBioMedia,
  defaultMemberBioParagraphs,
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
    orientationOverrides:
      existing.orientationOverrides && typeof existing.orientationOverrides === "object"
        ? existing.orientationOverrides
        : {},
    cropYOverrides:
      existing.cropYOverrides && typeof existing.cropYOverrides === "object"
        ? existing.cropYOverrides
        : {},
    cropXOverrides:
      existing.cropXOverrides && typeof existing.cropXOverrides === "object"
        ? existing.cropXOverrides
        : {},
    bioParagraphs: Array.isArray(existing.bioParagraphs) && existing.bioParagraphs.length
      ? existing.bioParagraphs
      : defaultMemberBioParagraphs[slug] || [],
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

function getOrientation(value) {
  return value === "portrait" ? "portrait" : "landscape";
}

function clampCropY(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function clampCropX(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function getDefaultCropY(item) {
  return getOrientation(item?.orientation) === "portrait" ? 0 : 50;
}

function getDefaultCropX() {
  return 50;
}

function getCropY(item) {
  return clampCropY(item?.cropY) ?? getDefaultCropY(item);
}

function getCropX(item) {
  return clampCropX(item?.cropX) ?? getDefaultCropX(item);
}

function getFrameStyle(item) {
  const cropX = getCropX(item);
  const cropY = getCropY(item);
  return {
    objectPosition: `${cropX}% ${cropY}%`,
    transformOrigin: `${cropX}% ${cropY}%`,
  };
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
    <div className="space-y-2">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-2">
        <img
          src={item.src}
          alt=""
          loading="lazy"
          decoding="async"
          className="max-h-72 w-full rounded-xl bg-black object-contain"
        />
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img
          src={item.src}
          alt=""
          loading="lazy"
          decoding="async"
          className={`aspect-square w-full object-cover ${item.className || ""}`}
          style={getFrameStyle(item)}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/70">
          Site crop
        </div>
      </div>
    </div>
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
    const orientationOverrides = draft.orientationOverrides || {};
    const cropYOverrides = draft.cropYOverrides || {};
    const cropXOverrides = draft.cropXOverrides || {};
    const merged = [...defaults, ...customItems].map((item) => ({
      ...item,
      ...(orientationOverrides[item.id]
        ? { orientation: getOrientation(orientationOverrides[item.id]) }
        : {}),
      ...(Number.isFinite(Number(cropYOverrides[item.id]))
        ? { cropY: clampCropY(cropYOverrides[item.id]) }
        : {}),
      ...(Number.isFinite(Number(cropXOverrides[item.id]))
        ? { cropX: clampCropX(cropXOverrides[item.id]) }
        : {}),
    }));
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

  const updateBioText = (value) => {
    updateDraft({
      ...draft,
      bioParagraphs: value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    });
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

  const updateItemOrientation = (id, orientation) => {
    const nextOrientation = getOrientation(orientation);
    const existingCropY = clampCropY(draft.cropYOverrides?.[id]);
    const existingCropX = clampCropX(draft.cropXOverrides?.[id]);
    updateDraft({
      ...draft,
      orientationOverrides: {
        ...(draft.orientationOverrides || {}),
        [id]: nextOrientation,
      },
      cropYOverrides: {
        ...(draft.cropYOverrides || {}),
        [id]: existingCropY ?? (nextOrientation === "portrait" ? 0 : 50),
      },
      cropXOverrides: {
        ...(draft.cropXOverrides || {}),
        [id]: existingCropX ?? 50,
      },
      customItems: (draft.customItems || []).map((item) =>
        item.id === id
          ? {
              ...item,
              orientation: nextOrientation,
              cropY: existingCropY ?? (nextOrientation === "portrait" ? 0 : 50),
              cropX: existingCropX ?? 50,
            }
          : item
      ),
    });
  };

  const updateItemCropX = (id, currentCropX, delta) => {
    const nextCropX = clampCropX((currentCropX ?? 50) + delta);
    updateDraft({
      ...draft,
      cropXOverrides: {
        ...(draft.cropXOverrides || {}),
        [id]: nextCropX,
      },
      customItems: (draft.customItems || []).map((item) =>
        item.id === id ? { ...item, cropX: nextCropX } : item
      ),
    });
  };

  const updateItemCropY = (id, currentCropY, delta) => {
    const nextCropY = clampCropY((currentCropY ?? 50) + delta);
    updateDraft({
      ...draft,
      cropYOverrides: {
        ...(draft.cropYOverrides || {}),
        [id]: nextCropY,
      },
      customItems: (draft.customItems || []).map((item) =>
        item.id === id ? { ...item, cropY: nextCropY } : item
      ),
    });
  };

  const resetItemCropY = (item) => {
    const nextCropY = getDefaultCropY(item);
    const nextCropX = getDefaultCropX(item);
    updateDraft({
      ...draft,
      cropXOverrides: {
        ...(draft.cropXOverrides || {}),
        [item.id]: nextCropX,
      },
      cropYOverrides: {
        ...(draft.cropYOverrides || {}),
        [item.id]: nextCropY,
      },
      customItems: (draft.customItems || []).map((customItem) =>
        customItem.id === item.id ? { ...customItem, cropX: nextCropX, cropY: nextCropY } : customItem
      ),
    });
  };

  const save = async (mode = "all") => {
    if (!token) {
      setStatus({ tone: "error", message: "Log in before saving changes." });
      return;
    }

    const isBioSave = mode === "bio";
    const isPhotoSave = mode === "photos";

    setStatus({
      tone: "pending",
      message: isBioSave ? "Saving bio text..." : isPhotoSave ? "Saving photo rotation..." : "Saving changes...",
    });

    try {
      const result = await saveMemberMedia({ token, member: selectedMember, media: draft });
      const nextOverrides = result.media || {};
      setOverrides(nextOverrides);
      setDraft(getInitialMedia(selectedMember, nextOverrides));
      setStatus({
        tone: "success",
        message: isBioSave
          ? "Bio text saved. The public band card will use this text."
          : isPhotoSave
            ? "Photo rotation saved. The public bio rotation will use these settings."
            : "Saved. The public bio and photo rotation will use these settings.",
      });
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
      const prepared = await prepareImageForUpload(file);
      const uploadFile = prepared.file;

      if (uploadFile.size > maxOptimizedUploadBytes) {
        setStatus({ tone: "error", message: "Prepared image is still too large. Try a smaller or simpler image." });
        return;
      }

      setStatus({ tone: "pending", message: "Uploading optimized image to the media bucket..." });

      const dataBase64 = await readFileAsBase64(uploadFile);
      const result = await uploadMemberMedia({
        token,
        member: selectedMember,
        file: uploadFile,
        dataBase64,
        orientation: prepared.orientation,
        cropX: 50,
        cropY: prepared.orientation === "portrait" ? 0 : 50,
      });
      const item = {
        ...result.item,
        orientation: prepared.orientation,
        cropX: 50,
        cropY: prepared.orientation === "portrait" ? 0 : 50,
      };
      const nextDraft = {
        ...draft,
        customItems: [...(draft.customItems || []), item],
        orientationOverrides: {
          ...(draft.orientationOverrides || {}),
          [item.id]: prepared.orientation,
        },
        cropXOverrides: {
          ...(draft.cropXOverrides || {}),
          [item.id]: 50,
        },
        cropYOverrides: {
          ...(draft.cropYOverrides || {}),
          [item.id]: prepared.orientation === "portrait" ? 0 : 50,
        },
        order: [...(draft.order || []), item.id],
      };
      setDraft(nextDraft);
      setStatus({ tone: "success", message: "Uploaded. Press Save Photo Rotation to publish this rotation update." });
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
            <h1 className="mt-2 text-3xl font-black uppercase leading-[0.95] md:text-5xl">
              Individual Band Member Bio
              <span className="block">Media Portal</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Manage your own bio text and image rotation. Update your written bio, hide anything you do not want shown,
              upload new media, and save the order.
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
                Logged-in members can edit their bio text, upload images, hide, unhide, reorder, and save their own rotation.
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
                <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black uppercase">{memberName} bio text</h2>
                      <p className="mt-1 text-sm text-white/50">
                        Separate paragraphs with a blank line. Press Save Bio Text to publish written changes.
                      </p>
                    </div>
                    <div className="flex max-w-xs flex-col items-start gap-2 sm:items-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            ...draft,
                            bioParagraphs: defaultMemberBioParagraphs[selectedMember] || [],
                          })
                        }
                        className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-white/35 hover:text-white"
                      >
                        Reset to original site bio
                      </button>
                      <p className="text-left text-[11px] leading-4 text-white/38 sm:text-right">
                        Restores the original default bio text built into the website.
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={(draft.bioParagraphs || []).join("\n\n")}
                    onChange={(event) => updateBioText(event.target.value)}
                    rows={12}
                    className="mt-4 min-h-[280px] w-full rounded-2xl border border-white/12 bg-black/55 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-yellow-100/55"
                    placeholder="Write bio text here..."
                  />
                  <button
                    type="button"
                    onClick={() => save("bio")}
                    disabled={!token}
                    className="mt-4 rounded-full bg-yellow-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Save bio text
                  </button>
                </div>

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
                      onClick={() => save("photos")}
                      disabled={!token}
                      className="rounded-full bg-yellow-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Save photo rotation
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
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Image shape</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {["portrait", "landscape"].map((orientation) => (
                            <button
                              key={`${item.id}-${orientation}`}
                              type="button"
                              onClick={() => updateItemOrientation(item.id, orientation)}
                              className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                                getOrientation(item.orientation) === orientation
                                  ? "border-yellow-100 bg-yellow-100 text-black"
                                  : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                              }`}
                            >
                              {orientation}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] leading-4 text-white/38">
                          Portrait keeps the top edge visible in the site tile and hover rotation.
                        </p>
                        <div className="mt-4 border-t border-white/10 pt-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Crop position</p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                              X {getCropX(item)}% / Y {getCropY(item)}%
                            </p>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <span />
                            <button
                              type="button"
                              onClick={() => updateItemCropY(item.id, getCropY(item), -5)}
                              className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:border-white/35 hover:text-white"
                            >
                              Higher
                            </button>
                            <span />
                            <button
                              type="button"
                              onClick={() => updateItemCropX(item.id, getCropX(item), -5)}
                              className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:border-white/35 hover:text-white"
                            >
                              Left
                            </button>
                            <button
                              type="button"
                              onClick={() => resetItemCropY(item)}
                              className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition hover:border-white/35 hover:text-white"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemCropX(item.id, getCropX(item), 5)}
                              className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:border-white/35 hover:text-white"
                            >
                              Right
                            </button>
                            <span />
                            <button
                              type="button"
                              onClick={() => updateItemCropY(item.id, getCropY(item), 5)}
                              className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:border-white/35 hover:text-white"
                            >
                              Lower
                            </button>
                            <span />
                          </div>
                          <p className="mt-2 text-[11px] leading-4 text-white/38">
                            Adjust until the square Site crop shows the best part of the photo, then save.
                          </p>
                        </div>
                      </div>
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
