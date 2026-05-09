import { useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA_BASE_URL, mediaAssets } from "./mediaAssets";

const imageExtensions = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const videoExtensions = new Set(["mp4", "mov"]);

function getExtension(key) {
  return key.split(".").pop()?.toLowerCase() || "";
}

function getAssetType(asset) {
  const extension = getExtension(asset.key);

  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  return "file";
}

function getFolder(key) {
  return key.split("/")[0] || "root";
}

function getAssetUrl(asset) {
  return `${MEDIA_BASE_URL}/${asset.key}`;
}

function groupAssets(assets) {
  return assets.reduce((groups, asset) => {
    const folder = getFolder(asset.key);
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(asset);
    return groups;
  }, {});
}

function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  return Promise.resolve();
}

function AssetCard({ asset }) {
  const url = getAssetUrl(asset);
  const type = getAssetType(asset);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-yellow-200/35 hover:bg-white/[0.065] hover:shadow-[0_0_30px_rgba(250,204,21,0.12)]">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-black/70">
        {type === "image" ? (
          <img
            src={url}
            alt={asset.description}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
          />
        ) : type === "video" ? (
          <video
            src={url}
            preload="metadata"
            muted
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/65">
            File
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-yellow-100/65">
            {type} asset
          </p>
          <h3 className="mt-2 text-sm font-black uppercase leading-snug text-white">
            {asset.description}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/35 p-3">
          <p className="break-all font-mono text-[11px] leading-5 text-white/60">{asset.key}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            Open
          </a>
          <button
            type="button"
            onClick={() => copyToClipboard(url)}
            className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 transition hover:border-yellow-200/60 hover:bg-yellow-200 hover:text-black"
          >
            Copy URL
          </button>
          <a
            href={url}
            download
            className="rounded-full border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

export default function MediaAdmin() {
  const [search, setSearch] = useState("");
  const filteredAssets = mediaAssets.filter((asset) => {
    const haystack = `${asset.key} ${asset.description} ${asset.oldFile}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const grouped = groupAssets(filteredAssets);
  const folders = Object.keys(grouped).sort();
  const imageCount = mediaAssets.filter((asset) => getAssetType(asset) === "image").length;
  const videoCount = mediaAssets.filter((asset) => getAssetType(asset) === "video").length;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12%] top-[-16%] h-[34rem] w-[34rem] rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="absolute bottom-[-18%] right-[-12%] h-[34rem] w-[34rem] rounded-full bg-white/8 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.38em] text-yellow-100/65">
              Private Media Admin
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-[-0.04em] text-white md:text-7xl">
              Asset Library
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full border border-white/15 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
            >
              Main Site
            </Link>
            <Link
              to="/epk"
              className="rounded-full border border-white/15 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
            >
              EPK
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:grid-cols-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Total</p>
            <p className="mt-2 text-3xl font-black text-white">{mediaAssets.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Images</p>
            <p className="mt-2 text-3xl font-black text-white">{imageCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Videos</p>
            <p className="mt-2 text-3xl font-black text-white">{videoCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Base URL</p>
            <p className="mt-2 break-all font-mono text-xs text-white/65">{MEDIA_BASE_URL}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-yellow-200/15 bg-yellow-200/8 p-5 text-sm leading-7 text-yellow-50/78">
          This page is a visual catalogue only. To replace an asset, upload a new file to Cloudflare R2 using the exact
          key shown on the card. The public URL remains stable if the key stays the same.
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {folders.map((folder) => (
            <a
              key={folder}
              href={`#folder-${folder}`}
              className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/65 transition hover:border-yellow-200/50 hover:bg-yellow-200 hover:text-black"
            >
              {folder} ({grouped[folder].length})
            </a>
          ))}
        </div>

        <div className="mt-8">
          <label className="sr-only" htmlFor="media-search">
            Search media assets
          </label>
          <input
            id="media-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search filename, folder, or description..."
            className="w-full rounded-2xl border border-white/12 bg-black/45 px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-200/55 focus:bg-black/65"
          />
        </div>

        <div className="mt-10 space-y-14">
          {folders.map((folder) => (
            <section key={folder} id={`folder-${folder}`} className="scroll-mt-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/38">
                    R2 folder
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase text-white md:text-5xl">{folder}</h2>
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                  {grouped[folder].length} assets
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[folder].map((asset) => (
                  <AssetCard key={asset.key} asset={asset} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
