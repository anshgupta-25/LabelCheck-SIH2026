# Judges Q&A — SIH 2026 (SIH26034)

The ten questions we expect, and the answers we give. Keep them short,
confident, and honest about limits.

---

### 1. How accurate is your OCR? What if it misreads?

We show a per-field confidence score and full raw-text review — it's auditable,
not a black box. Every field is editable, so an officer corrects any misread
before the verdict is finalized. We'd rather be transparent about 84% than
claim a fake 100%.

### 2. Indian labels are in Hindi and regional languages. Does this work?

We have an English/Hindi language mode today that reads Devanagari alongside
English. Tamil, Telugu, Bengali, Marathi and Gujarati are on our roadmap via
OCR language packs — the architecture already supports adding them.

### 3. What stops someone printing a fake but "compliant-looking" label?

*(the killer question)*

Our tool verifies that declarations are **present and valid**, which is exactly
the Legal Metrology mandate. Catching outright fraud is a separate layer:
role-based logins for authorized inspectors, cross-checking MRP against ranges,
and integration with government registration databases are on our roadmap.
We're honest that we solve the compliance-checking problem, not fraud detection
— but we're the scalable first line.

### 4. How is this different from just reading the label yourself?

Scale and consistency. A human does ~1 product/minute and gets tired. We do it
in seconds, apply Rule 6 identically every time, cite the exact sub-rule, and
log everything for audit. No human can inspect crores of e-commerce listings —
we can.

### 5. Why should the government use this over existing tools?

There is no existing tool that combines OCR with a codified Legal Metrology
rule engine and an officer verification workflow. We're purpose-built for
Rule 6, not a generic OCR app.

### 6. What's your tech stack and why?

React frontend, managed Postgres backend and storage, a vision/OCR extraction
service, and a modular pattern-matching rule engine. We chose these for speed
to build and easy scaling — rules are data, so new declarations plug in without
a rebuild.

### 7. Can this actually scale to millions of products?

Yes — it's cloud-native and API-driven, so it scales horizontally. For
e-commerce, our batch-scanning roadmap lets platforms check entire catalogues
via API before listing.

### 8. How do you handle a blurry or curved package photo?

The confidence score drops and flags weak reads, prompting a re-shoot in better
light. The extraction-quality meter tells the user exactly how reliable this
scan was.

### 9. Is your compliance logic legally correct?

Each of the 7 checks maps to a specific Rule 6(1) sub-clause — (a) through (g)
— and we cite the exact rule for every violation. We modelled it directly on
the Legal Metrology (Packaged Commodities) Rules, 2011.

### 10. What's your business/deployment model?

It's a public-good enforcement tool — deployable as a web/mobile app for Legal
Metrology officers, an API for e-commerce platforms, and a consumer self-check.
It strengthens consumer protection at national scale.

---

## Answering rules for the team

- Lead with the one-line answer, then one supporting detail. Stop talking.
- Never bluff a number. "We measure it and show it" beats a made-up figure.
- Name the limit before the judge does — it reads as competence, not weakness.
- Every claim should be demonstrable on screen within 10 seconds.
