// Weekly backup: pulls to-do state from Supabase, uploads a dated JSON to Dropbox.
// Runs inside GitHub Actions. Requires repo secrets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY secrets"); process.exit(1); }
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const cfgs = await (await fetch(`${SUPABASE_URL}/rest/v1/backup_config?select=*`, { headers: h })).json();
const states = await (await fetch(`${SUPABASE_URL}/rest/v1/appstate?select=user_id,payload,updated_at`, { headers: h })).json();
if (!Array.isArray(cfgs) || cfgs.length === 0) { console.log("No Dropbox connections configured — nothing to back up."); process.exit(0); }

let failed = false;
for (const c of cfgs) {
  const s = states.find((x) => x.user_id === c.user_id);
  if (!s) { console.log(`No app data yet for user ${c.user_id}, skipping.`); continue; }
  const tok = await (await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: c.dropbox_refresh_token, client_id: c.dropbox_app_key }),
  })).json();
  if (!tok.access_token) { console.error("Dropbox auth failed — reconnect Dropbox in the app settings."); failed = true; continue; }
  const name = `weekly-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const up = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok.access_token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: `/backups/${name}`, mode: "overwrite" }),
      "Content-Type": "application/octet-stream",
    },
    body: JSON.stringify(s.payload, null, 2),
  });
  if (up.ok) console.log(`Backed up ${name}`);
  else { console.error(`Upload failed: ${await up.text()}`); failed = true; }
}
process.exit(failed ? 1 : 0);
