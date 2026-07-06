# Weekly — setup guide (GitHub Pages + password-protected sync)

A TeuxDeux-style weekly to-do app that installs like a real app on your iPhone and Mac, works offline, syncs both ways, and keeps your to-dos behind your email + password. Total setup: ~10 minutes, $0.

## 1. Host it on GitHub Pages (3 min)

1. Go to https://github.com/new — name the repo (e.g. `weekly`), keep it **Public**, click Create.
   (Public is fine: this folder contains no secrets. Your to-dos live in Supabase behind your login, not in the repo.)
2. On the new repo page, click **"uploading an existing file"**, drag ALL files from this folder in, and click **Commit changes**.
3. Repo **Settings → Pages** → under "Build and deployment", Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → Save.
4. Wait ~1 minute. Your app is live at: `https://YOUR-USERNAME.github.io/weekly/`

## 2. Set up the database + login (5 min)

1. https://supabase.com → **New project** (free tier).
2. Left sidebar → **SQL Editor** → New query → paste the contents of `supabase.sql` → **Run**.
   This creates the table AND the security rule: each account can only ever read/write its own rows.
3. Left sidebar → **Authentication → Sign In / Providers → Email** → turn **OFF "Confirm email"** (so you can sign in instantly without a confirmation email).
4. Left sidebar → **Project Settings → API** (or "API Keys"). Copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** key (`eyJ...` — this one is designed to be public; your password is what protects the data)

## 3. Connect the app

1. Open your GitHub Pages URL → gear icon → **Sync between devices**.
2. Paste the URL + anon key → Connect.
3. **Create account** with your email + a strong password. You're synced.
4. On your other device: same URL, same gear menu, same URL/key, then **Sign in**.
5. Recommended: back in Supabase → **Authentication → Sign In / Providers** → turn OFF **"Allow new users to sign up"** so nobody else can even create an account on your project.

## 4. Install as an app

- **iPhone:** open the URL in Safari → Share → **Add to Home Screen**.
- **Mac:** open the URL in Safari → **File → Add to Dock**.

## Security model (plain English)

- Anyone visiting your link sees an empty app with a login wall — never your data.
- The database refuses every request that isn't signed in as you (enforced server-side by row-level security, not just hidden in the app).
- Your session stays signed in on your own devices; Sign out from the gear menu on shared computers.

## How syncing behaves

- Saves hit your device instantly, then push to Supabase within a second.
- Other devices pull the latest when you open/switch to the app, and every 45s while open.
- Offline? Keep working — changes push automatically when you're back. Simultaneous edits on two devices: most recent save wins.

## Updating the app later

Replace the files in the GitHub repo with new ones (same drag-and-drop upload) — installed copies pick up the update on next launch.

## 5. Weekly Dropbox auto-backup + restore

**Create the Dropbox app (3 min, one time):**
1. https://www.dropbox.com/developers/apps → **Create app** → choose **Scoped access** → **App folder** → name it (e.g. `weekly-todos`) → Create.
2. **Permissions** tab → check `files.content.write` and `files.content.read` → Submit.
3. Copy the **App key** from the Settings tab.

**Connect it in the app:** gear icon → **Dropbox backup** → paste the App key → "Open Dropbox to approve" → approve → paste the code Dropbox shows → Finish. Backups will land in `Dropbox/Apps/weekly-todos/backups/`.

**Turn on the weekly schedule (2 min):** the backup runs from your GitHub repo every Monday, even if you never open the app. In the repo:
1. **Settings → Secrets and variables → Actions → New repository secret**, add two:
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API → **service_role** key. This key bypasses your login wall, which is exactly why it lives ONLY in GitHub's encrypted secrets and never in the app or the code. Don't paste it anywhere else.
2. That's it — the workflow file is already in this folder (`.github/workflows/backup.yml`). Test it: repo **Actions** tab → "Weekly Dropbox backup" → **Run workflow**, then check your Dropbox.

**Restore:** gear icon → Dropbox backup → **Restore from backup…** → pick a dated file → confirm. The backup replaces your current state and syncs to all devices. (A "Back up now" button is there too — handy before big cleanups.)

## Offline behavior (upgraded)

The app is fully usable with no internet: it launches from cache, all edits work, and everything pushes when you reconnect. If you edited on two devices while offline, changes are now **merged per-task** — the union of both devices' work, newest edit wins per item, completions and history never lost. Storage is also flagged as persistent so the OS won't evict it during cleanup.
