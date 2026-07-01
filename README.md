# Kendriya Vidyalaya IIT Kharagpur — Student Progress & School Portal

A school-owned, mobile-responsive web portal for **KV IIT Kharagpur** (classes I–XII).
Its spine is a **continuous, year-on-year student progress record** with real analytics,
wrapped in attendance, announcements/events, monthly reports, leave and parent feedback.

Access is driven by **allotment**, enforced at the database with **Supabase Row Level
Security** — the UI hiding data is never the security boundary.

> All data is **synthetic/demo**. No real student PII.

---

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4** — design tokens in `globals.css` `@theme`.
- **Supabase**: Postgres + Auth + RLS + Storage + Edge Functions (Deno) + `pg_cron`.
- **Recharts** (styled strictly to the KV tokens) · **Hugeicons** (single icon set, centralised in `src/components/icons.tsx`).
- **i18n**: English / Hindi / Bengali via translation keys (`src/i18n`), localised numbers & dates.

## Demo logins

On the login screen, one tap signs you in as each role. Password (all): `kviit@demo1`.

| Role | Email | Scope |
|---|---|---|
| Principal | `principal@kv.demo` | Whole school |
| Class Teacher | `classteacher@kv.demo` | VIII-A (all subjects, full history) |
| Subject Teacher | `teacher@kv.demo` | Mathematics across allotted sections |
| Parent / Guardian | `parent@kv.demo` | Two children (sibling switcher) |
| Student | `student@kv.demo` | Own record only |
| Office / Admin | `office@kv.demo` | Manage; unrestricted read |

Each lands in a **DB-scoped** view — RLS returns zero rows outside scope regardless of what the client asks for.

## Run locally

```bash
npm install
# .env.local already contains the public Supabase URL + anon key
npm run dev        # http://localhost:3000
```

## Database

All schema lives in `supabase/migrations/` and is already applied to the linked project.
To re-apply / point at another project, run them in order with the helper:

```bash
export SUPABASE_ACCESS_TOKEN=...       # Supabase personal access token
export SUPABASE_REF=...                # project ref
node scripts/apply-sql.mjs supabase/migrations/0001_core_schema.sql
# … 0002 … through 0008
```

| Migration | Purpose |
|---|---|
| `0001_core_schema` | 25 tables, enums, constraints, indexes |
| `0002_security` | `app` scope helpers + RLS policies on every table |
| `0003_analytics` | RLS-aware views + RPC (trends, distributions, top/needs-support, auto-conclusions) |
| `0004_rls_performance` | Set-based helpers so large tables stay fast under RLS |
| `0005_history_scope` | Class teacher sees each student's full prior-year history |
| `0006_slippage_job` | `refresh_slippage_flags()` — scheduled early-slippage computation |
| `0007_cron` | Nightly `pg_cron` schedule for the slippage job |
| `0008_storage` | `brand` (public) + `reports` (private) Storage buckets |

### Seed & verify

```bash
export SUPABASE_SERVICE_ROLE=...       # server-only key
node scripts/seed.mjs         # ~270 students, 2 years of marks, attendance, comms
node scripts/seed-auth.mjs    # demo auth users + profile links
node scripts/verify-rls.mjs   # proves each role only sees its scope
```

`verify-rls.mjs` output (proof the boundary holds):

```
role          students  marks  attendance  slippage
principal          270  22680      8100         5
classteacher        30   2520       900         2
teacher            150   1440      4500         3
parent               2    168        60         0   ← never sees slippage
student              1     84        30         0   ← own record only
```

## The access model (RLS)

`teacher_allotment` (staff × section × subject, with `is_class_teacher`) drives everything.
Private `app.*` helpers (SECURITY DEFINER) resolve the caller's scope once per query:

- **Subject teacher** → their subject × allotted sections.
- **Class teacher** → their whole section, all subjects, **full multi-year history**.
- **Principal / office** → everything.
- **Guardian / student** → own record(s) only; **never** the needs-support / slippage lists.

## Analytics (the centrepiece)

- Per-student **continuous record**: assessment timeline, subject trend lines, every result shown
  as a delta vs the student's own past ("62, up from 55 last time").
- **Section/class analytics** scoped by allotment: subject-vs-subject, section-vs-section,
  distribution, best performers, students-needing-support (intervention-framed, staff-only),
  and **auto-generated "Areas of improvement"** computed from real metrics.
- **Early-slippage flags** recomputed nightly (`pg_cron`).

## Edge Functions (`supabase/functions/`)

| Function | Purpose |
|---|---|
| `absence-email` | Emails guardians of students marked absent (Resend) |
| `monthly-report` | Generates a class's monthly reports in one step → Storage + email |

Deploy (needs the Supabase CLI + `RESEND_API_KEY` secret):

```bash
supabase link --project-ref $SUPABASE_REF
supabase functions deploy absence-email
supabase functions deploy monthly-report
supabase secrets set RESEND_API_KEY=...
```

## Design system

Warm, institutional (brief §5): **gold = aspiration**, **warm ink = trust**; the tricolour
green/saffron appear **only** as data-status colours. Inter everywhere, hairline borders, soft
warm shadows, consistent rounding. The **official KV emblem** drops into `public/brand/kv-emblem.svg`
(a neutral typographic placeholder ships until then — no invented logo).

## Security notes

- The service-role key is **server-only** (`.env.local` `SUPABASE_SERVICE_ROLE_KEY`, Edge Functions). Never shipped to the client.
- The tokens used to build this demo should be **rotated** before any real use.
