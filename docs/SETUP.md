# Setup Guide

Everything needed to run LabelCheck locally or deploy it.

## 1. Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 22.x (see `.nvmrc`) |
| npm | 10+ (ships with Node) |
| Git | any recent version |

## 2. Clone and install

```sh
git clone <this-repository-url>
cd labelcheck
npm install
```

## 3. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```sh
# Supabase — Project settings → API
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Same values, server-side (SSR + server functions)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_PROJECT_ID=<project-ref>

# OCR — any OpenAI-compatible vision model; Gemini by default
OCR_API_KEY=<api-key>
```

`OCR_API_KEY` is read only inside the OCR server function, so it never reaches
the browser. With only the key set, the app uses Google Gemini. To use OpenAI
(or OpenRouter, Groq…), also set `OCR_API_URL` and `OCR_MODEL` — ready-made
blocks are in `.env.example`.

Vite reads `.env` once at startup — restart `npm run dev` after changing it.

## 4. Run

```sh
npm run dev        # http://localhost:8080
npm run build      # production build (SSR server + client)
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier --write .
```

## 5. Backend (database + storage)

The app uses Supabase: Postgres for the `scans` audit log and a **private**
storage bucket `label-images` served through short-lived signed URLs. The full
schema lives in `supabase/migrations/` and can rebuild a fresh project with no
manual steps — see [DATABASE.md](./DATABASE.md).

## 6. Deployment

**Netlify** is pre-configured:

- `netlify.toml` → build `npm run build`, publish `dist`, `NITRO_PRESET=netlify`
- `.nvmrc` → pins Node 22.14.0
- Add every variable from step 3 in Site settings → Environment variables
- Use **Clear cache and deploy site** after changing variables

Any other Nitro target works by setting `NITRO_PRESET` (e.g. `node-server`,
`vercel`, `cloudflare-module`) at build time.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Text extraction is not configured" | `OCR_API_KEY` missing in `.env` or on the host; restart the dev server after adding it |
| "The OCR API key was rejected" | Key is wrong, disabled, or billing is not enabled at the provider |
| Demo buttons work but uploads fail | Supabase env vars not set, or the `label-images` bucket / policies are missing |
| Report images 404 | Signed URL expired — reload the report |
| `Deploy directory 'dist/client' does not exist` | Publish directory must be `dist` |
| Build fails on Node 24 | Use Node 22 (`.nvmrc`) or set `NODE_VERSION=22.14.0` |
