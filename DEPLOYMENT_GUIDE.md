# Updating and deploying Wahamath

Wahamath is connected to GitHub and Vercel. The normal workflow is:

1. Change the code locally.
2. Test the change locally.
3. Commit and push it to GitHub.
4. Vercel automatically creates a new Production deployment from `main`.

## 1. Start the app locally

Open a terminal in the project folder:

```powershell
cd C:\Users\or201\OneDrive\Documents\wahamath
npm run dev
```

Open the local URL printed by Next.js (normally `http://localhost:3000`) and test your change.

## 2. Check what changed

```powershell
git status
git diff
```

Never commit `.env`, `.env.local`, passwords, database URLs, or Vercel Blob tokens. They are ignored by Git and must remain private.

## 3. Commit the change

For a specific file:

```powershell
git add src/app/page.tsx
git commit -m "Describe the change"
git push origin main
```

For several intentional source changes, list each file or folder after `git add`:

```powershell
git add src prisma data scripts package.json package-lock.json
git commit -m "Describe the change"
git push origin main
```

Run `git status` before committing. Do not add temporary files such as logs, `.vercel-source`, or `.vercel-deploy.tgz`.

## 4. Wait for Vercel

Pushing to `main` triggers Vercel automatically. It normally takes about one minute.

Check deployments from the terminal:

```powershell
npx vercel@latest ls wahamath
```

The newest deployment should show `Ready` and `Production`. The live site is:

```text
https://wahamath.vercel.app
```

If a deployment shows `Error`, retrieve its build logs:

```powershell
npx vercel@latest inspect https://YOUR-DEPLOYMENT.vercel.app --logs
```

Fix the reported code error, then repeat the commit and push steps.

## Exercise images and Vercel Blob

The SM1, PC2, and TCS exercise images are hosted in Vercel Blob, not deployed from `public/programs/`. This avoids Vercel's source-size limit.

If you add or replace those images:

1. Put the files under the relevant local folder in `public/programs/`.
2. Ensure `BLOB_READ_WRITE_TOKEN` is present in `.env.local`.
3. Upload them:

```powershell
npm run assets:upload
```

4. Commit and push only the related code/data changes. Do **not** commit the large `public/programs/` image folders.

## Database migrations

When `prisma/schema.prisma` changes, create and test a Prisma migration locally before pushing. The migration must be committed under `prisma/migrations/`.

```powershell
npx prisma migrate dev --name describe_the_change
npx prisma generate
```

Before a production deployment, make sure the production database has received the migration:

```powershell
npx prisma migrate deploy
```

Use the production database URL only from private environment files; never paste it into source code or Git.

## Quick checklist

- [ ] Tested locally with `npm run dev`
- [ ] Checked `git status`
- [ ] No environment files or secrets staged
- [ ] Committed with a clear message
- [ ] Pushed with `git push origin main`
- [ ] Confirmed the newest Vercel deployment is `Ready`
- [ ] Hard-refreshed the website (`Ctrl + F5`) if the old UI appears
