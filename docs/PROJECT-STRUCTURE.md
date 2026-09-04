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
│   ├── assets/                 # imported images (demo labels, app icon)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives — avoid editing by hand
│   │   ├── site/               # Navbar, Footer, Reveal, WireGlobe
│   │   ├── report/             # ReportView — checklist, confidence, corrections
│   │   └── pitch/              # Deck — the in-app 6-slide pitch
│   ├── hooks/
│   ├── integrations/supabase/  # GENERATED — never hand-edit
│   ├── lib/
│   │   ├── compliance.ts       # the Rule 6 engine (rules + detectors + verdict)
│   │   ├── demo-labels.ts      # hardcoded, network-free demo fixtures
│   │   ├── ocr.functions.ts    # server function: image → text
│   │   ├── scans.ts            # persistence, uploads, signed URLs
│   │   └── utils.ts
│   ├── routes/                 # file-based routing — one file per URL
│   │   ├── __root.tsx          # shell: head tags, navbar, footer, toaster
│   │   ├── index.tsx           # /
│   │   ├── scan.tsx            # /scan
│   │   ├── report.$id.tsx      # /report/:id
│   │   ├── history.tsx         # /history
│   │   ├── how-it-works.tsx    # /how-it-works
│   │   └── pitch.tsx           # /pitch
│   ├── routeTree.gen.ts        # GENERATED — never edit
│   ├── router.tsx              # router config (preloading, defaults)
│   ├── start.ts / server.ts    # server entry + middleware
│   └── styles.css              # design tokens + Tailwind v4 theme
├── .env.example                # every variable the app reads
├── .nvmrc                      # Node version pin (22.14.0)
├── netlify.toml                # external-host build config
└── README.md
```

## Conventions

**Routing.** Adding a page = adding a file in `src/routes/`. The filename *is*
the URL. `routeTree.gen.ts` regenerates itself — never touch it.

**Styling.** All colours, shadows and gradients are semantic tokens in
`src/styles.css`. Never hardcode `text-white`, `bg-black`, or `bg-[#hex]` in a
component — it bypasses the theme.

**Server vs browser.**
`import.meta.env.VITE_*` in browser code, `process.env.*` only inside server
functions (and read it *inside* the handler, not at module scope).
Files named `*.server.ts` and anything importing them must never be reached
from a component.

**Generated files — do not hand-edit.**
`src/routeTree.gen.ts`, everything in `src/integrations/supabase/`,
`supabase/config.toml`.

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
| Change pitch slides | `src/components/pitch/Deck.tsx` |
| Add a page | new file in `src/routes/` |
| Change colours/fonts | `src/styles.css` |
| Change the database | new file via the migration flow → `docs/DATABASE.md` |
| Add an env var | `.env.example` + `docs/SETUP.md` |
