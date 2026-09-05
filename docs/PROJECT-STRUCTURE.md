# Project Structure

Where everything lives, and the conventions that keep it from breaking.

```text
labelcheck/
├── docs/                       # ← all documentation (start at docs/README.md)
├── public/                     # static files served as-is (favicons, robots.txt)
├── supabase/
│   ├── config.toml             # project reference
│   └── migrations/             # append-only SQL history  → docs/DATABASE.md
├── src/
│   ├── assets/                 # imported images (demo labels)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives actually in use (7 files)
│   │   ├── site/               # Navbar, Footer, Reveal, WireGlobe
│   │   ├── report/             # ReportView — checklist, confidence, corrections
│   │   └── pitch/              # Deck — the in-app 6-slide pitch
│   ├── integrations/supabase/
│   │   ├── client.ts           # browser + SSR Supabase client
│   │   └── types.ts            # GENERATED from the schema — never hand-edit
│   ├── lib/
│   │   ├── compliance.ts       # the Rule 6 engine (rules + detectors + verdict)
│   │   ├── demo-labels.ts      # hardcoded, network-free demo fixtures
│   │   ├── ocr.functions.ts    # server function: image → text (Gemini)
│   │   ├── report-pdf.ts       # client-side PDF export with QR code
│   │   ├── scans.ts            # persistence, uploads, signed URLs
│   │   ├── error-page.ts       # HTML for the SSR 500 page
│   │   └── utils.ts
│   ├── routes/                 # file-based routing — one file per URL
│   │   ├── __root.tsx          # shell: head tags, navbar, footer, toaster
│   │   ├── index.tsx           # /
│   │   ├── scan.tsx            # /scan — single or batch (up to 8) + Demo Mode
│   │   ├── batch.tsx           # /batch → redirects to /scan
│   │   ├── report.$id.tsx      # /report/:id
│   │   ├── history.tsx         # /history
│   │   ├── how-it-works.tsx    # /how-it-works
│   │   └── pitch.tsx           # /pitch
│   ├── routeTree.gen.ts        # GENERATED — never edit
│   ├── router.tsx              # router config (preloading, defaults)
│   ├── start.ts                # request middleware: friendly 500 page + CSRF
│   └── styles.css              # design tokens + Tailwind v4 theme
├── .env.example                # every variable the app reads
├── .nvmrc                      # Node version pin (22.14.0)
├── components.json             # shadcn/ui config (for `npx shadcn add …`)
├── netlify.toml                # deploy config (Nitro preset)
├── vite.config.ts              # Vite + TanStack Start + Tailwind + Nitro
└── README.md
```

## Conventions

**Routing.** Adding a page = adding a file in `src/routes/`. The filename *is*
the URL (`$id` for a dynamic segment). `routeTree.gen.ts` regenerates itself on
dev/build — never touch it.

**Styling.** All colours, shadows and gradients are semantic tokens in
`src/styles.css`. Never hardcode `text-white`, `bg-black`, or `bg-[#hex]` in a
component — it bypasses the theme.

**Server vs browser.**
`import.meta.env.VITE_*` in browser code, `process.env.*` only inside server
functions (and read it *inside* the handler, not at module scope). Secrets such
as `OCR_API_KEY` must never get a `VITE_` prefix.

**UI primitives.** Only the shadcn components the app uses are kept. Need
another one? `npx shadcn@latest add <name>` and commit the new file.

**Generated files — do not hand-edit.**
`src/routeTree.gen.ts` and `src/integrations/supabase/types.ts`.

**The rule engine is data.** A new mandatory declaration means one new rule
object plus one detector in `src/lib/compliance.ts` — no other file changes.

**Demo Mode is sacred.** `src/lib/demo-labels.ts` must stay fully hardcoded:
no OCR, no network, no database dependency. It is what runs on stage.

## Where to make a given change

| I want to… | Edit |
| --- | --- |
| Add/modify a compliance rule | `src/lib/compliance.ts` |
| Change demo label content | `src/lib/demo-labels.ts` |
| Change how the report looks | `src/components/report/ReportView.tsx` |
| Change the PDF export | `src/lib/report-pdf.ts` |
| Swap the OCR provider/model | `.env` (`OCR_API_KEY`, `OCR_API_URL`, `OCR_MODEL`) |
| Change pitch slides | `src/components/pitch/Deck.tsx` |
| Add a page | new file in `src/routes/` |
| Change colours/fonts | `src/styles.css` |
| Change the database | new migration file → `docs/DATABASE.md` |
| Add an env var | `.env.example` + `docs/SETUP.md` |
