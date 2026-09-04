# Architecture

```text
 Photo / upload
        │
        ▼
 Image store (private bucket, signed URLs)
        │
        ▼
 OCR server function  ──►  vision model, key held server-side
        │  raw text + quality estimate
        ▼
 Rule engine (src/lib/compliance.ts)
        │  7 detectors → {found, value, confidence, ruleRef}
        ▼
 Verdict + report  ──►  persisted to `scans` ──► /history
```

## Modules

| Path | Responsibility |
| --- | --- |
| `src/lib/compliance.ts` | Rule 6 detectors, validation, confidence scoring, verdict |
| `src/lib/ocr.functions.ts` | Server function that performs extraction |
| `src/lib/scans.ts` | Persistence, image upload, signed URLs |
| `src/lib/demo-labels.ts` | Hardcoded, network-free demo fixtures |
| `src/components/report/ReportView.tsx` | Checklist, confidence bars, manual correction |
| `src/components/pitch/Deck.tsx` | In-app 6-slide pitch deck |
| `src/routes/*` | Home, scan, report, history, how-it-works, pitch |

## The rule engine

Rules are **data**, not code paths. Each entry declares its key, label,
statutory reference, plain-language requirement, violation text, and whether it
is critical to the verdict. Adding a declaration means adding a rule object and
a detector — no rewrite.

### Rule 6(1) mapping

| # | Declaration | Sub-rule | Critical |
| --- | --- | --- | --- |
| 1 | Manufacturer / packer / importer name & address | 6(1)(a) | yes |
| 2 | Common or generic name of commodity | 6(1)(b) | yes |
| 3 | Net quantity (g/kg/ml/L/N) | 6(1)(c) | yes |
| 4 | Month & year of manufacture | 6(1)(d) | yes |
| 5 | MRP inclusive of all taxes | 6(1)(e) | yes |
| 6 | Consumer care details | 6(1)(f) | yes |
| 7 | Country of origin | 6(1)(g) | advisory |

A pack is **NON-COMPLIANT** if any critical declaration is missing or invalid.

### Validation, not mere presence

A field passes only when the extracted value is genuinely valid:

- Net quantity must be a **positive** number with a valid unit — `0 g`, `Net Wt.`
  with no figure, or a bare unit all fail.
- MRP must be a **positive** rupee amount — `₹0` or a blank price fails.
- Manufacture date must be a plausible month/year within a sane year range.
- Manufacturer must be a real name/address string, not a stray character.
- Anything not found is forced to `found: false`, `value: null`, `confidence: 0`
  so the icon, status text, and confidence bar can never disagree.

## Confidence scoring

Per-field confidence combines pattern strength (explicit declaration lead-in >
loose vocabulary match) with an overall extraction-quality estimate derived from
the raw text. Low confidence is surfaced, never hidden.

## Trust and transparency

- Raw OCR text is always reviewable in the report.
- Every field is editable; corrections re-run the verdict and are persisted.
- Every violation cites its exact sub-rule with a plain-language explanation.

## Roadmap

- Regional-language OCR packs (Tamil, Telugu, Bengali, Marathi, Gujarati)
- Batch / catalogue API for e-commerce pre-listing checks
- Role-based officer accounts and signed inspection records
- MRP range cross-checks and registration-database lookups
