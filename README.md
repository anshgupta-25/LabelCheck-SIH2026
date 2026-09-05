<div align="center">

<img src="public/favicon.png" width="88" alt="LabelCheck logo" />

# LabelCheck

**Photograph a label. Get a cited Legal Metrology verdict in seconds.**

An AI-powered compliance scanner that checks whether a packaged product's label
meets India's Legal Metrology (Packaged Commodities) Rules, 2011.

Smart India Hackathon 2026 · Problem statement **SIH26034** · Ministry of Consumer Affairs

[Docs](./docs/README.md) ·
[Judges Q&A](./docs/JUDGES-QA.md) ·
[Demo script](./docs/DEMO-SCRIPT.md)

</div>

---

## The problem

Every pre-packaged commodity sold in India must carry **7 mandatory
declarations** under Rule 6. Today they are verified by eye, one pack at a time
— roughly one product a minute, inconsistently, with no audit trail. Crores of
e-commerce listings are effectively unchecked.

## The solution

Point a camera at the label. LabelCheck extracts the text, runs a codified
Rule 6 engine over it, and returns a per-declaration verdict with the exact
sub-rule cited for every violation — in seconds, identically every time,
logged for audit.

## What makes it defensible

| | |
| --- | --- |
| **Cited, not guessed** | Every check maps to a specific Rule 6(1) sub-clause, (a) through (g) |
| **Auditable, not a black box** | Per-field confidence scores plus a raw-extraction panel |
| **Human in the loop** | Any field is editable; corrections re-run the verdict and persist |
| **Validation, not presence** | `0 g`, `₹0`, a blank price or an implausible date all fail — a field passes only if the value is genuinely valid |
| **Presentation-proof** | Demo Mode is fully hardcoded — no OCR, no network, identical every run |
| **Extensible** | Rules are data; a new declaration is a new rule object, not a rewrite |

## The 7 declarations

| # | Declaration | Sub-rule |
| --- | --- | --- |
| 1 | Manufacturer / packer / importer name & address | 6(1)(a) |
| 2 | Common or generic name of commodity | 6(1)(b) |
| 3 | Net quantity (g / kg / ml / L / N) | 6(1)(c) |
| 4 | Month & year of manufacture | 6(1)(d) |
| 5 | MRP inclusive of all taxes | 6(1)(e) |
| 6 | Consumer care details | 6(1)(f) |
| 7 | Country of origin | 6(1)(g) |

A pack is **NON-COMPLIANT** if any of 1–6 is missing or invalid.
Full detail in [COMPLIANCE-RULES.md](./docs/COMPLIANCE-RULES.md).

## How it works

```text
Photo ──► private image store ──► OCR server function ──► rule engine ──► cited report ──► history
                                    (key server-side)      (7 detectors)     (editable)
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Pages

| Route | What it does |
| --- | --- |
| `/` | Animated hero, three-step explainer, impact stats |
| `/scan` | Drag-and-drop or camera upload — one label, or up to 8 for a **batch check** — plus **Try a Demo** |
| `/report/:id` | Verdict banner, per-field checklist, confidence bars, raw text, inline correction, **PDF export**, **share link + QR** |
| `/history` | Every past inspection with verdict, timestamp and filters |
| `/how-it-works` | Animated architecture flow, legal basis, roadmap |
| `/pitch` | Built-in 6-slide SIH pitch deck with fullscreen |

## Quick start

```sh
npm install
cp .env.example .env   # fill in Supabase + Gemini values
npm run dev            # http://localhost:8080
```

Environment variables and deployment: [SETUP.md](./docs/SETUP.md).
Folder map and conventions: [PROJECT-STRUCTURE.md](./docs/PROJECT-STRUCTURE.md).
Schema and migrations: [DATABASE.md](./docs/DATABASE.md).

## Tech stack

React 19 · TanStack Start & Router · Vite 8 · Tailwind CSS v4 · Motion ·
Supabase (Postgres + private storage) · Google Gemini vision OCR behind a
server function · a modular, well-commented rule engine in TypeScript.

## Roadmap

- Regional-language OCR packs — Tamil, Telugu, Bengali, Marathi, Gujarati
- Batch / catalogue API so e-commerce platforms can pre-check listings
- Role-based officer accounts and signed inspection records
- MRP range cross-checks and registration-database lookups

## Team

**Team Leader — Ansh Gupta (12402677)**

---

<div align="center">

Built for Smart India Hackathon 2026 · Ministry of Consumer Affairs · SIH26034

</div>
