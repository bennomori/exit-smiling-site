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
bash /home/ubuntu/deploy-backend-aws.sh
```

The script pulls latest Git changes, builds Medusa, installs production dependencies in `.medusa/server`, copies `.env`, and restarts PM2.

If deploy fails because the AWS working tree has local changes, inspect before overwriting:

```bash
cd ~/exit-smiling-site
git status --short
git diff -- path/to/file
```

If the local changes are already safely in Git or only server-local build noise, stash before deploying:

```bash
git stash push -u -m pre-deploy-server-local-changes
bash /home/ubuntu/deploy-backend-aws.sh
```

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

## Order Alerts

Postmark order alerts are sent by the backend after orders. Relevant backend env variables:

- `POSTMARK_SERVER_TOKEN`
- `ORDER_ALERT_FROM_EMAIL`
- `ORDER_ALERT_EMAILS`
- `ORDER_ALERT_PUBLIC_ASSET_BASE_URL`

Use the live order flow to verify:

- Medusa order appears
- Stripe payment appears
- Postmark alert arrives
- Email subject total matches order total

## Uptime Monitoring

Configure an external monitor such as UptimeRobot or Better Stack:

- Website monitor: `https://www.exitsmiling.com.au`
- API monitor: `https://api.exitsmiling.com.au/health`
- Expected status: `200`
- Interval: `5 minutes`

## Incident Checklist

If merch does not load:

```bash
curl -i https://api.exitsmiling.com.au/health
pm2 status
pm2 logs exit-smiling-medusa --lines 80
sudo nginx -t
```

If the website is blank:

- Check latest Cloudflare deployment status.
- Open browser console for runtime errors.
- Confirm the active Cloudflare deployment points to the latest Git commit.

If images are broken:

```bash
curl -I https://api.exitsmiling.com.au/static/1777200456033-accessories.jpg
ls -lh /var/www/exit-smiling-static | head
```

If checkout fails:

- Check Stripe Dashboard payment status.
- Check Medusa Admin order status.
- Check PM2 logs.
- Confirm backend `.env` has current Stripe and webhook values.

## Secret Handling

- Do not commit `.env`, database dumps, access keys, or API secrets.
- Browser publishable keys are less sensitive but should still live in Cloudflare Pages secrets where practical.
- If GitHub reports a leaked secret, rotate/revoke it, remove it from current Git, and close the alert only after rotation.
