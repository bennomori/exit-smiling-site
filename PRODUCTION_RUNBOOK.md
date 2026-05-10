# Exit Smiling Production Runbook

This runbook covers the live website, AWS Medusa backend, backups, and common recovery commands. Do not add secrets to this file.

## Live URLs

- Website: https://www.exitsmiling.com.au
- Website apex: https://exitsmiling.com.au
- Backend API: https://api.exitsmiling.com.au
- Medusa Admin: https://api.exitsmiling.com.au/app
- Backend health check: https://api.exitsmiling.com.au/health

## Hosting

- Frontend: Cloudflare Pages project `exit-smiling-site`
- Backend: AWS EC2 Ubuntu server at `54.253.36.230`
- Backend process manager: PM2 process `exit-smiling-medusa`
- Backend reverse proxy: Nginx
- Database: PostgreSQL on the AWS server
- Static Medusa product media: `/var/www/exit-smiling-static`
- S3 backup bucket: `exit-smiling-medusa-backups`

## Local Development

From Windows PowerShell:

```powershell
cd C:\exit-smiling-site
npm run dev
```

Build frontend locally:

```powershell
cd C:\exit-smiling-site
npm.cmd run build
```

Build backend locally:

```powershell
cd C:\exit-smiling-site\exit-smiling-backend
npm.cmd run build
```

## Git And Frontend Deploys

Cloudflare Pages is connected to GitHub. Pushing to `main` triggers a production frontend deployment.

```powershell
cd C:\exit-smiling-site
git status
git add .
git commit -m "Describe the change"
git push
```

Check Cloudflare deployments:

```powershell
npx.cmd wrangler pages deployment list --project-name exit-smiling-site
```

Cloudflare frontend build variables are stored as Pages secrets, not in Git:

- `VITE_MEDUSA_URL`
- `VITE_MEDUSA_PUBLISHABLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

List configured secret names:

```powershell
npx.cmd wrangler pages secret list --project-name exit-smiling-site
```

Update one Pages secret:

```powershell
$env:SECRET_VALUE = "paste-new-value-here"
$env:SECRET_VALUE | npx.cmd wrangler pages secret put VITE_GOOGLE_MAPS_API_KEY --project-name exit-smiling-site
```

After changing a Vite frontend secret, trigger a fresh deploy because Vite bakes env values into the static bundle:

```powershell
git commit --allow-empty -m "Redeploy frontend with updated environment"
git push
```

## AWS Login

From Windows PowerShell:

```powershell
ssh -i C:\Users\ben\.ssh\exit-smiling-aws-key.pem ubuntu@54.253.36.230
```

Backend source path on AWS:

```bash
cd ~/exit-smiling-site/exit-smiling-backend
```

Built Medusa server path on AWS:

```bash
cd ~/exit-smiling-site/exit-smiling-backend/.medusa/server
```

## Backend Deploy

Backend deploy script on AWS:

```bash
cd /home/ubuntu/exit-smiling-site
git pull --ff-only
chmod +x scripts/deploy-backend-aws.sh
scripts/deploy-backend-aws.sh
```

The script pulls latest Git changes, builds Medusa, installs production dependencies in `.medusa/server`, copies `.env`, copies static assets, restarts PM2, and checks local/public backend health.

If deploy fails because the AWS working tree has local changes, inspect before overwriting:

```bash
cd ~/exit-smiling-site
git status --short
git diff -- path/to/file
```

If the local changes are already safely in Git or only server-local build noise, stash before deploying:

```bash
git stash push -u -m pre-deploy-server-local-changes
scripts/deploy-backend-aws.sh
```

See `BACKEND_DEPLOY.md` for the slower beginner-safe version of this process.

## Live Health Check

Run this after any deployment, DNS change, backend restart, or Stripe/Medusa change.

From Windows PowerShell:

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

Expected result:

```text
Health check passed.
```

This checks the website, media Worker, backend API, product API, production JS bundle, and confirms the live JS has no old Cloudinary references.

## Media Admin

Private media catalogue:

```text
https://www.exitsmiling.com.au/media-admin
```

Use this to find current media URLs, preview grouped R2 assets, copy URLs, and download assets.

Rules:

- Keep `/media-admin` private behind Cloudflare Access or the site preview gate.
- To replace an image/video without code changes, upload the replacement to Cloudflare R2 using the exact same key shown on the media card.
- To add a new image/video, use a clean folder/key, update `media-r2-map.csv`, update `src/mediaAssets.js` if it should appear in `/media-admin`, and update the site/POS code if it should be used live.
- Do not delete the old R2 `cloudinary/` fallback folder until the site has been stable for several days.

Dry-run old fallback cleanup:

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\cleanup-old-r2-cloudinary.ps1
```

Only after several stable days:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\cleanup-old-r2-cloudinary.ps1 -Delete
```

See `MEDIA_ADMIN.md` for the full media workflow.

## PM2 Commands

```bash
pm2 status
pm2 logs exit-smiling-medusa --lines 80
pm2 restart exit-smiling-medusa --update-env
pm2 save
```

## Nginx Commands

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
sudo tail -n 80 /var/log/nginx/error.log
sudo tail -n 80 /var/log/nginx/access.log
```

Expected public API health response:

```bash
curl -i https://api.exitsmiling.com.au/health
```

Expected result: HTTP `200` with `"ok": true` and `"database": "ok"`.

## Backend Environment

Source env file:

```bash
~/exit-smiling-site/exit-smiling-backend/.env
```

Built server env file:

```bash
~/exit-smiling-site/exit-smiling-backend/.medusa/server/.env
```

After editing backend `.env`, copy it into the built server and restart PM2:

```bash
cp ~/exit-smiling-site/exit-smiling-backend/.env ~/exit-smiling-site/exit-smiling-backend/.medusa/server/.env
pm2 restart exit-smiling-medusa --update-env
```

Do not commit `.env` files.

## Static Product Media

Product media is served by Nginx from:

```bash
/var/www/exit-smiling-static
```

Check a static file:

```bash
curl -I https://api.exitsmiling.com.au/static/1777200456033-accessories.jpg
```

Expected result: HTTP `200`.

If images are missing after a backend rebuild, confirm files exist:

```bash
ls -lh /var/www/exit-smiling-static | head
```

## Database Backups

Manual backup script:

```bash
/home/ubuntu/backup-medusa-db.sh
```

Local backup folder:

```bash
ls -lh /home/ubuntu/backups
```

S3 backup bucket:

```bash
aws s3 ls s3://exit-smiling-medusa-backups | tail
```

Confirm AWS CLI region:

```bash
aws configure get region
```

Expected:

```text
ap-southeast-2
```

If upload tries `s3.y.amazonaws.com`, the region was entered incorrectly. Fix it:

```bash
aws configure set region ap-southeast-2
```

## Database Restore

Use with care. Stop the backend before restoring.

```bash
pm2 stop exit-smiling-medusa
sudo -u postgres dropdb medusa
sudo -u postgres createdb -O medusa medusa
gunzip -c /home/ubuntu/backups/medusa-file.sql.gz | psql "postgres://medusa:REDACTED@localhost:5432/medusa"
pm2 restart exit-smiling-medusa --update-env
```

For local-to-AWS migration, use plain SQL if `pg_restore` reports an unsupported dump version.

## Medusa Admin

Admin URL:

```text
https://api.exitsmiling.com.au/app/login
```

If the admin user exists but password is unknown, reset the `emailpass` provider password from the AWS server. Generate a Medusa-compatible hash:

```bash
cd ~/exit-smiling-site/exit-smiling-backend/.medusa/server
HASH=$(node -e "const scrypt=require('scrypt-kdf'); scrypt.kdf('TempPassword123!', {logN:15,r:8,p:1}).then(h=>console.log(h.toString('base64')))")
echo ${#HASH}
```

Then update the target admin user:

```bash
sudo -u postgres psql -d medusa -c "update provider_identity set provider_metadata = jsonb_set(coalesce(provider_metadata, '{}'::jsonb), '{password}', to_jsonb('$HASH'::text), true), updated_at = now() where provider = 'emailpass' and entity_id = 'admin-email@example.com';"
```

Immediately change the temporary password after login.

## Stripe

Stripe webhook endpoint:

```text
https://api.exitsmiling.com.au/hooks/payment/pp_stripe_stripe
```

Basic route check:

```bash
curl -i -X POST https://api.exitsmiling.com.au/hooks/payment/pp_stripe_stripe
```

Expected result: HTTP `200 OK`.

For real verification, use Stripe Dashboard test transactions or Stripe CLI test events.

## POS Before A Gig

Run this checklist before doors open.

- Confirm tablet has internet through venue Wi-Fi, phone hotspot, or tablet SIM.
- Open `https://www.exitsmiling.com.au/pos`.
- Connect the Stripe S710 reader from the POS reader controls.
- Add one low-value test item or use Stripe test mode if still testing.
- Confirm product images load.
- Confirm stock quantities show under sizes.
- Confirm card, cash, complimentary, discount, and receipt flows are visible.
- Confirm staff dropdown contains the expected names.
- Confirm shipping address prompt flashes if adding a no-stock/print-on-demand item.
- Confirm recent sales panel opens and does not show errors.
- Keep the tablet in landscape mode for practical cart/product layout.

If using two tablets:

- Only one tablet can control one Stripe S710 reader at a time.
- Use a second reader for a second active card-taking tablet.
- Simulated reader can remain for testing only.

## POS After A Gig

Run this after the merch stand closes.

- Check POS daily totals for card, cash, complimentary, and total sales.
- Confirm recent POS sales are visible.
- Confirm Medusa Admin shows the POS orders.
- Confirm Stripe Dashboard shows card payments and any refunds.
- Confirm cash and complimentary sales are recorded in Medusa, not Stripe.
- Run a database backup on AWS.

AWS backup command:

```bash
/home/ubuntu/backup-medusa-db.sh
aws s3 ls s3://exit-smiling-medusa-backups | tail
```

## Website Change Checklist

After changing the public website:

```powershell
cd C:\exit-smiling-site
npm.cmd run build
git status
git add .
git commit -m "Describe the website change"
git push
npx.cmd wrangler pages deployment list --project-name exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

Then manually check:

- Home page loads.
- Merch loads.
- Checkout opens.
- EPK page loads.
- Media/video that changed plays correctly.
- Mobile menu still opens/closes.

## Backend Change Checklist

After changing backend code, Medusa routes, Stripe, order alerts, POS order logging, or MailerLite/Postmark logic:

- Push the code to GitHub.
- SSH into AWS.
- Run `scripts/deploy-backend-aws.sh`.
- Check PM2 status.
- Run the Windows live health check.
- Place one small test order if checkout/POS/order logic changed.

Windows:

```powershell
ssh -i C:\Users\ben\.ssh\exit-smiling-aws-key.pem ubuntu@54.253.36.230
```

AWS:

```bash
cd /home/ubuntu/exit-smiling-site
git pull --ff-only
scripts/deploy-backend-aws.sh
pm2 status
```

## Order Alerts

Postmark order alerts are sent by the backend after orders. Relevant backend env variables:

- `POSTMARK_SERVER_TOKEN`
- `ORDER_ALERT_FROM_EMAIL`
- `ORDER_ALERT_EMAILS`
- `ORDER_ALERT_PUBLIC_ASSET_BASE_URL`

Current production sender/recipient:

- `ORDER_ALERT_FROM_EMAIL=orders@exitsmiling.com.au`
- `ORDER_ALERT_EMAILS=orders@exitsmiling.com.au`

The PM2 production app runs from the built server folder:

```bash
/home/ubuntu/exit-smiling-site/exit-smiling-backend/.medusa/server
```

If changing order alert env values manually, update the `.env` file in that built server folder, then restart PM2:

```bash
cd /home/ubuntu/exit-smiling-site/exit-smiling-backend/.medusa/server
grep -n "ORDER_ALERT_FROM_EMAIL\|ORDER_ALERT_EMAILS" .env
pm2 restart exit-smiling-medusa
```

Use the live order flow to verify:

- Medusa order appears
- Stripe payment appears
- Postmark alert arrives
- Email subject total matches order total

Manual order alert resend/test using an existing order display ID:

```bash
curl -i -X POST "https://api.exitsmiling.com.au/store/order-alerts/send" -H "x-publishable-api-key: MEDUSA_PUBLISHABLE_KEY" -H "Content-Type: application/json" -d '{"order_id":"88","source":"Manual branded sender test","force":true}'
```

## Email Operations

Google Workspace is active for `exitsmiling.com.au`.

Primary paid mailbox:

- `ben@exitsmiling.com.au`

Aliases on that mailbox:

- `hello@exitsmiling.com.au`
- `merch@exitsmiling.com.au`
- `bookings@exitsmiling.com.au`
- `press@exitsmiling.com.au`
- `orders@exitsmiling.com.au`

Configured send-as identities in Gmail:

- `Exit Smiling <hello@exitsmiling.com.au>`
- `Exit Smiling Merch <merch@exitsmiling.com.au>`
- `Exit Smiling Bookings <bookings@exitsmiling.com.au>`
- `Exit Smiling Press <press@exitsmiling.com.au>`
- `Exit Smiling Orders <orders@exitsmiling.com.au>`

Email DNS/authentication status:

- Google MX active.
- SPF includes Google, Postmark, and MailerLite.
- DMARC exists in monitor mode (`p=none`).
- Postmark domain authentication is verified for `exitsmiling.com.au`.
- Google DKIM is pending until Google allows DKIM generation, usually 24-72 hours after Gmail activation.

When Google DKIM becomes available:

1. Go to Google Admin -> Apps -> Google Workspace -> Gmail -> Authenticate email.
2. Generate a `2048` bit DKIM TXT record for `exitsmiling.com.au`.
3. Add the TXT record in Cloudflare DNS.
4. Return to Google Admin and start authentication.
5. Send a test email from `hello@exitsmiling.com.au` and confirm it arrives normally.

## Uptime Monitoring

Better Stack is configured for external uptime monitoring.

- Website monitor: `https://www.exitsmiling.com.au`
- API monitor: `https://api.exitsmiling.com.au/health`
- Expected status: `200`
- Check type: HTTP status code / status
- HTTP method: `GET`
- Check frequency: `3 minutes`
- Confirmation period: `1-2 minutes`
- Recovery period: `3 minutes`
- SSL/TLS verification: On
- IP version: IPv4 only if available, otherwise default
- Regions: Australia and Asia preferred; all regions is acceptable if no false positives occur
- Request headers: none
- Alerting: e-mail alerts to the Better Stack team / Ben

Do not use the fake onboarding header:

```text
Authorization: Bearer 12345678abcdef==
```

The API health monitor must hit `/health`, not `/store/regions`. `/store/regions` intentionally returns a publishable-key warning without a frontend key.

Manual local health check from Windows:

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

If Better Stack supports test notifications, send one and confirm the alert email arrives.

## Incident Checklist

If merch does not load:

```bash
curl -i https://api.exitsmiling.com.au/health
pm2 status
pm2 logs exit-smiling-medusa --lines 80
sudo nginx -t
```

Then from Windows:

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

If the website is blank:

- Check latest Cloudflare deployment status.
- Open browser console for runtime errors.
- Confirm the active Cloudflare deployment points to the latest Git commit.
- If only one browser/device is broken, hard refresh or clear site cache.

If images are broken:

```bash
curl -I https://api.exitsmiling.com.au/static/1777200456033-accessories.jpg
ls -lh /var/www/exit-smiling-static | head
```

For R2-hosted site images/videos, check `/media-admin` and open the exact asset URL.

If checkout fails:

- Check Stripe Dashboard payment status.
- Check Medusa Admin order status.
- Check PM2 logs.
- Confirm backend `.env` has current Stripe and webhook values.

If POS reader fails:

- Confirm the S710 has internet.
- Confirm the tablet has internet.
- Re-register the reader code in POS if needed.
- Confirm only one tablet is trying to control that reader.
- Use simulated reader only for testing when the real reader is unavailable.

If order alert emails fail:

- Confirm the order appears in Medusa.
- Confirm Postmark sender is verified.
- Check PM2 logs for Postmark errors.
- Use the store order-alert test endpoint only if you need to isolate email delivery.

## Secret Handling

- Do not commit `.env`, database dumps, access keys, or API secrets.
- Browser publishable keys are less sensitive but should still live in Cloudflare Pages secrets where practical.
- If GitHub reports a leaked secret, rotate/revoke it, remove it from current Git, and close the alert only after rotation.
