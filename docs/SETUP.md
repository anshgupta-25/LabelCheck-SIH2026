# Setup Guide

Everything needed to run LabelCheck locally or deploy it.

## 1. Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 22.x (see `.nvmrc`) |
| Package manager | `bun` (preferred) or `npm` |
| Git | any recent version |

## 2. Clone and install

```sh
git clone <this-repository-url>
cd labelcheck
bun install       # or: npm install
```

## 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Server-side (used by server functions / SSR)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
SUPABASE_PROJECT_ID=<project-ref>

# AI gateway key used by the OCR server function
LOVABLE_API_KEY=<api-key>
```

On Lovable Cloud these are injected automatically — you only need them for
local/self-hosted runs.

## 4. Run

```sh
bun run dev       # http://localhost:8080
bun run build     # production build
bun run preview   # preview the production build
bun run lint      # eslint
```

## 5. Backend (database + storage)

Full schema, migration structure and how to rebuild a fresh environment:
[DATABASE.md](./DATABASE.md).

The app uses a managed Postgres + object storage backend.

**Table `scans`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `created_at` | timestamptz | default `now()` |
| `product_name` | text | best-effort product title |
| `image_url` | text | storage object path (private bucket) |
| `extracted_text` | text | raw OCR transcription |
| `language` | text | `eng` or `hin` |
| `verdict` | text | `compliant` / `non_compliant` |
| `field_results` | jsonb | per-field `{found, value, confidence, rule_ref}` |
| `source` | text | `upload` or `demo` |

Row Level Security is enabled, with explicit `GRANT`s for the app roles.
Label images live in a **private** storage bucket and are served through
short-lived signed URLs — no public image endpoint.

## 6. Deployment

**Recommended:** publish from Lovable (SSR + env vars + backend handled).

**Netlify:** already configured.

- `netlify.toml` → build `bun run build`, publish `dist`, `NITRO_PRESET=netlify`
- `.nvmrc` → pins Node 22.14.0
- Add every variable from step 3 in Site settings → Environment variables
- Use **Clear cache and deploy site** after changing variables

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Deploy directory 'dist/client' does not exist` | publish directory must be `dist` |
| Build fails with Node 24 | ensure `.nvmrc` is committed / set `NODE_VERSION=22.14.0` |
| OCR returns an error | `LOVABLE_API_KEY` missing on the host |
| Report images 404 | signed URL expired — reload the report |
| Demo buttons work but uploads fail | backend env vars not set in the host |
