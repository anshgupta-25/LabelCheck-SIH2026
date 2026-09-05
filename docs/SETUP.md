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
# Supabase - Project settings -> API (browser copy + server copy, same values)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>

# OCR - any OpenAI-compatible vision model (OpenAI shown; Gemini block in .env.example)
OCR_API_KEY=<api-key>
OCR_API_URL=https://api.openai.com/v1/chat/completions
OCR_MODEL=gpt-4.1-mini
```

`OCR_API_KEY` is read only inside the OCR server function, so it never reaches
the browser. `OCR_API_URL` and `OCR_MODEL` choose the provider; if you omit them
the app defaults to Google Gemini. Any OpenAI-compatible endpoint (OpenRouter,
Groq…) works the same way.

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

## 8. Authentication (Supabase Auth)

Scanning and History require a signed-in user; report links stay public so
QR codes and share links work for anyone. Users sign in with e-mail/password
or Google. Configure once in the Supabase dashboard → **Authentication**:

1. **URL configuration** → Site URL `https://sih.anshguptaa.in`; add redirect
   URLs `https://sih.anshguptaa.in/**`, `https://*.vercel.app/**` and
   `http://localhost:8080/**`. The app returns users to `/auth/callback`.
2. **Providers → Email** → for a live demo, turn **Confirm email** off so new
   accounts work instantly. Leave it on in production; the signup page then
   shows a "check your inbox" step.
3. **Providers → Google** → enable, paste the OAuth client ID and secret from
   Google Cloud Console (Credentials → OAuth 2.0 Client ID, type *Web
   application*). In Google Cloud, add the authorised redirect URI shown by
   Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`).

Ownership is enforced in the database (`owner_id` on `scans`, owner-only
insert/update/delete policies), so a user can only ever list, correct or delete
their own inspections.
