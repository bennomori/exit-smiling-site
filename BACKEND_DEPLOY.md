# Exit Smiling AWS Backend Deploy

Use this when backend code changes need to be deployed to the AWS Medusa server.

Frontend changes normally deploy through Cloudflare Pages automatically after `git push`. Backend changes need the AWS server to pull, build, and restart.

## Before You Start

Confirm the latest code is pushed to GitHub from your Windows machine.

```powershell
cd C:\exit-smiling-site
git status
git push
```

## Deploy Backend On AWS

Run these from Windows PowerShell.

```powershell
ssh -i C:\Users\ben\.ssh\exit-smiling-aws-key.pem ubuntu@54.253.36.230
```

Then run these from the AWS Ubuntu prompt.

```bash
cd /home/ubuntu/exit-smiling-site
git pull --ff-only
chmod +x scripts/deploy-backend-aws.sh
scripts/deploy-backend-aws.sh
```

The script does the following:

- Pulls the latest GitHub code.
- Installs backend dependencies.
- Builds Medusa with `NODE_OPTIONS=--max-old-space-size=1536`.
- Copies `.env` into the built Medusa server.
- Installs production dependencies inside `.medusa/server`.
- Copies backend static assets into `.medusa/server/static`.
- Restarts `exit-smiling-medusa` in PM2.
- Saves the PM2 process list.
- Checks local and public backend health.

## Manual Checks After Deploy

Run these from the AWS Ubuntu prompt.

```bash
pm2 status
curl -i https://api.exitsmiling.com.au/store/regions
```

The `/store/regions` response should say a publishable API key is required. That is expected and means the public backend is reachable.

Then run this from Windows PowerShell.

```powershell
cd C:\exit-smiling-site
powershell -ExecutionPolicy Bypass -File scripts\check-live-health.ps1
```

## If Something Fails

Check backend logs from the AWS Ubuntu prompt.

```bash
pm2 logs exit-smiling-medusa --lines 80
```

If PM2 is stopped:

```bash
pm2 restart exit-smiling-medusa --update-env
pm2 save
```

If the build fails with memory errors, rerun the build command manually:

```bash
cd /home/ubuntu/exit-smiling-site/exit-smiling-backend
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

## Important

- Do not paste secrets into Git.
- Do not commit `.env`, `.env.production`, database dumps, or SQL exports.
- Keep database backups running before major backend changes.
