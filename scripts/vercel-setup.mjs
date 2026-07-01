// Set Supabase env vars on the Vercel project and trigger a production redeploy.
//   node scripts/vercel-setup.mjs
// Requires: VERCEL_TOKEN
import "node:process";

const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) { console.error("Set VERCEL_TOKEN"); process.exit(1); }
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://qyiqdwrjtgdzocoffzvk.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXFkd3JqdGdkem9jb2ZmenZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODUwOTYsImV4cCI6MjA5ODQ2MTA5Nn0.UMeDptWDjGshwscCX4E7vCOzboMkBtl1V8uWsjaiS8E",
};

async function api(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

// 1. Identify account + teams
const me = await api("/v2/user");
console.log("user:", me.json?.user?.username ?? me.json?.user?.email ?? "?");
const teams = (await api("/v2/teams")).json?.teams ?? [];
const scopes = [{ teamId: null, label: "personal" }, ...teams.map((t) => ({ teamId: t.id, label: t.slug }))];

// 2. Find the project (match repo kviitkgp or name)
let project = null, scope = null;
for (const s of scopes) {
  const q = s.teamId ? `?teamId=${s.teamId}&limit=100` : "?limit=100";
  const list = (await api(`/v9/projects${q}`)).json?.projects ?? [];
  const found = list.find((p) =>
    p.name?.toLowerCase().includes("kviitkgp") ||
    p.link?.repo?.toLowerCase() === "kviitkgp" ||
    `${p.link?.org}/${p.link?.repo}`.toLowerCase() === "roshanyadav-2109/kviitkgp");
  if (found) { project = found; scope = s; break; }
  // fall back: remember first project in case there's exactly one
  if (!project && list.length) { /* keep scanning */ }
}
if (!project) {
  // list everything to help the user pick
  console.error("Could not auto-find the project. Projects visible to this token:");
  for (const s of scopes) {
    const q = s.teamId ? `?teamId=${s.teamId}&limit=100` : "?limit=100";
    const list = (await api(`/v9/projects${q}`)).json?.projects ?? [];
    list.forEach((p) => console.error(`  [${s.label}] ${p.name}  (repo: ${p.link?.org}/${p.link?.repo ?? "—"})`));
  }
  process.exit(1);
}
const tq = scope.teamId ? `?teamId=${scope.teamId}` : "";
console.log(`project: ${project.name}  scope: ${scope.label}  repo: ${project.link?.org}/${project.link?.repo}`);

// 3. Upsert env vars (production + preview + development)
for (const [key, value] of Object.entries(ENV)) {
  const r = await api(`/v10/projects/${project.id}/env${tq ? tq + "&upsert=true" : "?upsert=true"}`, {
    method: "POST",
    body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview", "development"] }),
  });
  console.log(`env ${key}: ${r.ok ? "set" : "FAILED " + JSON.stringify(r.json).slice(0, 200)}`);
}

// 4. Trigger a production redeploy from the connected git repo
if (!project.link?.repoId) { console.log("No git link found; redeploy manually in the Vercel dashboard."); process.exit(0); }
const dep = await api(`/v13/deployments${tq}`, {
  method: "POST",
  body: JSON.stringify({
    name: project.name,
    project: project.id,
    target: "production",
    gitSource: { type: project.link.type || "github", repoId: project.link.repoId, ref: "main" },
  }),
});
if (dep.ok) console.log(`redeploy triggered: https://${dep.json.url}  (state: ${dep.json.readyState || dep.json.status})`);
else console.log("redeploy FAILED:", JSON.stringify(dep.json).slice(0, 300), "\n→ add vars are set; just click Redeploy in the dashboard.");
