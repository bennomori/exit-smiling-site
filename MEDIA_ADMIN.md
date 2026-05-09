# Exit Smiling Media Admin

The private media catalogue is available at:

`https://www.exitsmiling.com.au/media-admin`

Keep this route behind Cloudflare Access or the site preview gate. It is intended for internal asset management only.

## Source Of Truth

The current media source of truth is Cloudflare R2:

- Bucket: `exit-smiling-media`
- Public worker base URL: `https://exit-smiling-media.bennoclark.workers.dev`
- Local asset map: `media-r2-map.csv`
- Website asset list: `src/mediaAssets.js`

## Replacing An Existing Asset

Use this when the site should update without a code change.

1. Open `/media-admin`.
2. Find the asset card.
3. Copy the exact key shown on the card, for example `hero/hometown-hero.png`.
4. Upload the replacement file to the same R2 bucket using that exact same key.
5. Keep the file type the same where possible, especially for video/image slots already used by the site.
6. Hard refresh the website and check the page that uses the asset.

If the key stays the same, the website URL stays the same.

## Adding A New Asset

Use this when the site needs a new image or video.

1. Upload the file into a sensible R2 folder such as `hero/`, `bio/`, `releases/`, `gigs/`, `press/`, or `videos/`.
2. Use a lowercase, descriptive filename with hyphens.
3. Add the new asset to `media-r2-map.csv` if it should be tracked.
4. Add it to `src/mediaAssets.js` if it should appear in `/media-admin`.
5. Update the relevant site or POS code to use the new URL.

## Avoid

- Do not rename an asset key already used by the live site unless the code is updated at the same time.
- Do not delete the old `cloudinary/` fallback folder from R2 until the site has been stable for several days.
- When ready, use `scripts/cleanup-old-r2-cloudinary.ps1` in dry-run mode first, then rerun with `-Delete`.
- Do not commit local database exports such as `medusa-prod.dump` or `medusa-prod.sql`.
