# Deploying iBreviary Web to Render.com (free)

This site is a static-friendly Next.js app with a thin Node backend (the API
proxy under `src/app/api/ibreviary/*`). It needs **no database, no
environment variables, and no extra services** — the free Render plan is
enough. A `render.yaml` blueprint is included so deployment is a few clicks.

---

## 1. Push the code to GitHub

Render deploys from a Git repo (GitHub, GitLab, or Bitbucket).

1. Unzip `ibreviary-web-src.zip` (the clean source of the site) if you got a
   bundle instead of a repo.
2. Create an empty repository on GitHub, e.g. `ibreviary-web`
   (Public or Private — Render works with either).
3. Push the code:

   ```bash
   cd ibreviary-web
   git init
   git add .
   git commit -m "iBreviary Web: dark theme, responsive, Render-ready"
   git branch -M main
   git remote add origin https://github.com/<you>/ibreviary-web.git
   git push -u origin main
   ```

## 2. Create the service on Render

### Option A — Blueprint (recommended, reads render.yaml)

1. Sign up / log in at [render.com](https://render.com) (free account is fine).
2. Dashboard → **New** → **Blueprint**.
3. Select your GitHub account, then pick the `ibreviary-web` repository.
4. Render reads `render.yaml` and shows one service, **ibreviary-web**
   (plan: Free, Node runtime). Click **Apply**.
5. Wait for the build (~2–4 min: `npm install && npm run build`) — done.

### Option B — Manual web service

Dashboard → **New** → **Web Service** → connect the repo, then set:

| Setting        | Value                                      |
| -------------- | ------------------------------------------ |
| Name           | `ibreviary-web` (anything)                 |
| Region         | nearest to you                             |
| Branch         | `main`                                     |
| Runtime        | **Node**                                   |
| Build command  | `npm install && npm run build`             |
| Start command  | `npm run start`                            |
| Instance type  | **Free**                                   |

No environment variables are needed. Leave the rest at the defaults.

## 3. What you get

- Your site at `https://<service-name>.onrender.com`.
- Push to `main` on GitHub → Render auto-deploys the update.
- HTTPS is automatic.

### Free-plan facts worth knowing

- **Spin-down:** after 15 minutes with no traffic, the service sleeps. The
  first request afterwards takes ~30–60 s to wake it (then it is fast again).
  The Liturgy of the Hours site is typically used a few times a day, so this
  is rarely a problem in practice.
- 750 instance-hours/month — more than enough for one always-awake-ish site.
- Render's free instances have 512 MB RAM; this app builds and runs well
  within it (the standalone server idles at ~100 MB).
- Custom domains work on the free plan (Dashboard → Settings → Custom
  Domains), if you own one.

## 4. Local development / verification

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also runs standalone packaging)
npm run start    # serves the standalone build on $PORT (default 3000)
```

## 5. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails with `next: not found` | Make sure the build command is exactly `npm install && npm run build` (npm puts `next` on the PATH). |
| Build fails on memory (exit 137) | Rare with Turbopack; re-run the deploy once. If it persists, use a Starter instance for one build, then switch back to Free. |
| Service up but page empty | Check logs: the app needs outbound internet to reach `www.ibreviary.com` — always available on Render. |
| First request after idle is slow | That is free-tier spin-down, not a bug — see above. |
| Want to change the port | You don't need to: the server binds to `$PORT`, which Render sets automatically. |

---

Source layout: `src/app` (Next.js App Router), `src/components/ibreviary`
(views), `src/lib/ibreviary` (zustand store, react-query hooks, IndexedDB
offline cache, upstream proxy), `render.yaml` (Render blueprint).
