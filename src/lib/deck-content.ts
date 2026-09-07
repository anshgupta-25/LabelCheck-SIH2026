/**
 * The SIH 2026 pitch, as data.
 *
 * One source of truth for three renderers: the on-screen deck, the PDF export
 * and the PPTX export. Anything a judge sees in the room is the same text they
 * get in the file, and nothing has to be kept in sync by hand.
 *
 * Every figure here is measured or cited. Where a number is a projection
 * rather than an observation it says so on the slide.
 */

export type Block =
  /** One line of framing under the title. */
  | { kind: "lead"; text: string }
  /** Accent-barred aside — a caveat, a caption, the honest footnote. */
  | { kind: "note"; text: string }
  /** Big-number stat cards across the slide. */
  | { kind: "metrics"; items: { value: string; label: string }[] }
  /** Card grid; `cols` sets the columns, the rest wrap. */
  | { kind: "cards"; cols: number; items: { badge?: string; title: string; body: string }[] }
  /** Numbered stages joined by arrows, each optionally naming its output. */
  | { kind: "pipeline"; items: { title: string; body: string; out?: string }[] }
  /** Zebra-striped table with an accent header rule. */
  | { kind: "table"; head: string[]; rows: string[][] }
  /** Two-column before/after, one row per aspect. */
  | { kind: "compare"; head: [string, string]; rows: { aspect: string; a: string; b: string }[] }
  /** Horizontal phase timeline. */
  | { kind: "timeline"; items: { when: string; title: string; body: string }[] }
  /** Horizontal bar chart; `value` is relative, `display` is the printed figure. */
  | {
      kind: "bars";
      caption?: string;
      items: { label: string; value: number; display: string; accent?: boolean }[];
    }
  /** A screenshot from /public, fitted and captioned. */
  | { kind: "image"; src: string; caption?: string }
  /** Several screenshots side by side, each captioned. */
  | { kind: "gallery"; items: { src: string; caption: string }[] }
  /** Screenshot on the left, points on the right. */
  | { kind: "split"; src: string; items: { title: string; body: string }[] };

export interface DeckSlide {
  id: string;
  /** Section number shown in the kicker; blank for the title and closing. */
  no: string;
  kicker: string;
  title: string;
  blocks: Block[];
  /** Speaker notes, carried into the PPTX notes pane. */
  notes: string;
}

export const DECK_META = {
  title: "LabelCheck",
  subtitle: "AI-powered Legal Metrology compliance verification",
  problemId: "SIH26034",
  ministry: "Ministry of Consumer Affairs, Food & Public Distribution",
  event: "Smart India Hackathon 2026",
  team: "CodeCatalysts",
  leader: "Ansh Gupta (12402677)",
  members: ["Dasari Aarya Nandan", "Archi Data", "Akshaj Kumar", "Bhumi Dwivedi", "Eshan Thakur"],
  url: "https://sih.anshguptaa.in",
};

/**
 * Slide order follows the SIH recommended structure: problem statement,
 * problem analysis, existing solutions and the gap, proposed solution, how it
 * works, architecture, stack, demo, evidence, impact, plan, future scope, team,
 * conclusion. "Not addressing the gap" is a listed judging pitfall, so slide 04
 * exists specifically to answer it.
 */
export const DECK: DeckSlide[] = [
  /* --------------------------------- 01 --------------------------------- */
  {
    id: "title",
    no: "",
    kicker: DECK_META.event,
    title: "LabelCheck — AI-powered Legal Metrology compliance scanner",
    blocks: [
      { kind: "lead", text: "Photograph a label. Get a cited compliance verdict in seconds." },
      {
        kind: "metrics",
        items: [
          { value: "7", label: "Rule 6(1) declarations verified" },
          { value: "~6s", label: "Photo to verdict, measured" },
          { value: "8", label: "Labels checked per batch" },
          { value: "Live", label: "sih.anshguptaa.in" },
        ],
      },
      {
        kind: "image",
        src: "/deck/hero.jpg",
        caption: `${DECK_META.problemId}  ·  ${DECK_META.ministry}  ·  Team ${DECK_META.team}`,
      },
    ],
    notes:
      "Open by saying the product is live and can be tried on the judges' own phone right now, at sih.anshguptaa.in. This is a working system, not a mockup.",
  },

  /* --------------------------------- 02 --------------------------------- */
  {
    id: "problem",
    no: "02",
    kicker: "Problem statement",
    title: "Seven declarations, crores of packages, verified by eye",
    blocks: [
      {
        kind: "lead",
        text: "Every pre-packaged commodity sold in India must carry seven mandatory declarations under Rule 6. Verification today is manual, one pack at a time.",
      },
      {
        kind: "cards",
        cols: 4,
        items: [
          {
            badge: "Who",
            title: "Enforcement officers",
            body: "Legal Metrology officers inspecting retail counters and warehouses, pack by pack.",
          },
          {
            badge: "Scale",
            title: "Lakhs of listings",
            body: "An e-commerce catalogue cannot be eyeballed at all, so most of it is never checked.",
          },
          {
            badge: "Speed",
            title: "One pack a minute",
            body: "A person reads seven declarations from memory, and tires as the shift goes on.",
          },
          {
            badge: "Record",
            title: "No audit trail",
            body: "Nothing records which sub-rule was applied, so a finding is hard to defend on appeal.",
          },
        ],
      },
      {
        kind: "note",
        text: "Contravention attracts penalties under the Legal Metrology Act, 2009 — but only where a violation is actually found. Unchecked packaging is unpenalised packaging.",
      },
    ],
    notes:
      "Do not claim a statistic you cannot source. The strength here is structural: the rules are not the bottleneck, the reading of them is.",
  },

  /* --------------------------------- 03 --------------------------------- */
  {
    id: "analysis",
    no: "03",
    kicker: "Problem analysis",
    title: "Where the manual process actually breaks",
    blocks: [
      {
        kind: "compare",
        head: ["Manual inspection today", "With LabelCheck"],
        rows: [
          {
            aspect: "Time per pack",
            a: "About a minute, by eye",
            b: "About six seconds, end to end",
          },
          {
            aspect: "Consistency",
            a: "Varies by officer, and by hour",
            b: "The same seven checks, every time",
          },
          {
            aspect: "Legal citation",
            a: "Recalled from memory",
            b: "Sub-rule printed against each finding",
          },
          {
            aspect: "Audit trail",
            a: "A paper note, if any",
            b: "Timestamped record, PDF and share link",
          },
          {
            aspect: "Scale",
            a: "One pack at a time",
            b: "Eight per batch; an API for a catalogue",
          },
        ],
      },
      {
        kind: "note",
        text: "Two officers can reach two different verdicts on the same pack. The rules are not the bottleneck — the reading of them is.",
      },
    ],
    notes: "This is the slide that earns the solution. Land the consistency row hardest.",
  },

  /* --------------------------------- 04 --------------------------------- */
  {
    id: "existing",
    no: "04",
    kicker: "Existing solutions",
    title: "What exists today, and the gap it leaves",
    blocks: [
      {
        kind: "cards",
        cols: 3,
        items: [
          {
            badge: "Today",
            title: "Manual inspection",
            body: "An officer reads the pack. Accurate when unhurried, but slow, inconsistent between officers, and leaves no structured record.",
          },
          {
            badge: "Today",
            title: "Generic OCR apps",
            body: "Extract text from an image, and stop there. They have no concept of Rule 6, so they cannot say whether a package is compliant.",
          },
          {
            badge: "Today",
            title: "Marketplace checklists",
            body: "Sellers self-declare against a form. Nothing verifies that the printed pack matches what was typed into the listing.",
          },
          {
            badge: "Gap",
            title: "No rule engine",
            body: "Nothing maps extracted text onto the seven sub-rules of Rule 6(1) and returns a verdict a judge or officer could cite.",
          },
          {
            badge: "Gap",
            title: "No validation",
            body: "Existing tools check that a field is present. None check that ₹0, 0 g or a blank date is not a valid declaration.",
          },
          {
            badge: "Gap",
            title: "No audit trail",
            body: "None produce a cited, shareable, correctable record that survives a challenge in a hearing.",
          },
        ],
      },
      {
        kind: "note",
        text: "LabelCheck closes exactly these three gaps: a codified Rule 6 engine, validation rather than presence, and a cited audit record for every inspection.",
      },
    ],
    notes:
      "'Not addressing the gap' is a listed judging mistake. This slide exists to make the gap explicit before we claim to fill it.",
  },

  /* --------------------------------- 05 --------------------------------- */
  {
    id: "solution",
    no: "05",
    kicker: "Proposed solution",
    title: "From a photograph to filed evidence",
    blocks: [
      {
        kind: "split",
        src: "/deck/report.jpg",
        items: [
          {
            title: "Photograph the pack",
            body: "One label, or up to eight at once, from any phone in the field.",
          },
          {
            title: "Seven checks, cited",
            body: "Each declaration validated against its own sub-rule from (a) to (g).",
          },
          {
            title: "A verdict with confidence",
            body: "Per-field score, the matched text, and the exact clause behind every violation.",
          },
          {
            title: "Correctable by the officer",
            body: "Any mis-read is editable in place; the verdict recomputes immediately.",
          },
          {
            title: "Filed as evidence",
            body: "A cited PDF with the photo, the raw text and a QR to the live verdict.",
          },
        ],
      },
      {
        kind: "note",
        text: "Validation, not presence: 0 g, a blank price, ₹0 or an impossible date all fail. A field passes only when the value itself is valid.",
      },
    ],
    notes:
      "The validation-not-presence point is the single strongest technical differentiator. Say it out loud.",
  },

  /* --------------------------------- 06 --------------------------------- */
  {
    id: "how",
    no: "06",
    kicker: "How it works",
    title: "Five stages, each handing on a named artefact",
    blocks: [
      {
        kind: "pipeline",
        items: [
          {
            title: "Capture",
            body: "The principal display panel — one pack, or eight at once.",
            out: "label.jpg",
          },
          {
            title: "Extract",
            body: "A vision model transcribes every printed line, server-side.",
            out: "raw text",
          },
          {
            title: "Apply Rule 6",
            body: "Seven detectors validate each declaration independently.",
            out: "7 outcomes",
          },
          {
            title: "Score",
            body: "Pattern strength blended with capture legibility.",
            out: "0-100% each",
          },
          {
            title: "Report",
            body: "Verdict, citations, logged for audit and exported as PDF.",
            out: "verdict + PDF",
          },
        ],
      },
      {
        kind: "note",
        text: "Every stage is inspectable: the report shows the raw transcription, the matched substring and which heuristic fired for each field. Nothing is a black box.",
      },
    ],
    notes:
      "Walk left to right. The artefact chips are what make it read as engineering, not a diagram.",
  },

  /* --------------------------------- 07 --------------------------------- */
  {
    id: "architecture",
    no: "07",
    kicker: "Solution architecture",
    title: "Stateless, horizontally scalable, secret-safe",
    blocks: [
      {
        kind: "split",
        src: "/deck/pipeline.jpg",
        items: [
          {
            title: "Stateless by design",
            body: "Nothing is held between requests, so one code path serves a single pack, a batch of eight, or an API caller.",
          },
          {
            title: "Rules are data",
            body: "Each declaration is a self-contained rule object. A new regulation is one new object, not a rewrite.",
          },
          {
            title: "Ownership in the database",
            body: "Supabase Postgres with row-level security; a user can never reach another user's inspection.",
          },
          {
            title: "Secrets never ship",
            body: "Extraction runs in a server function. We grep the built bundle to prove the key is not in it.",
          },
        ],
      },
    ],
    notes:
      "The screenshot is the live /how-it-works page, which renders this pipeline and every detector from the engine itself.",
  },

  /* --------------------------------- 08 --------------------------------- */
  {
    id: "tech",
    no: "08",
    kicker: "Technology stack",
    title: "Every choice has a reason",
    blocks: [
      {
        kind: "cards",
        cols: 3,
        items: [
          {
            badge: "Extraction",
            title: "Vision-language model",
            body: "Classical OCR fails on curved packaging, low contrast and mixed scripts. The provider swaps via two environment variables — no lock-in.",
          },
          {
            badge: "Rule engine",
            title: "TypeScript detectors",
            body: "A statutory verdict must be explainable. Regex and heuristics can be read, cited and unit-tested; a classifier cannot be cross-examined.",
          },
          {
            badge: "Framework",
            title: "TanStack Start, React 19",
            body: "SSR plus server functions keep the API key server-side while the UI stays a single deployable. No separate backend to operate.",
          },
          {
            badge: "Data",
            title: "Supabase Postgres + RLS",
            body: "Ownership enforced in the database rather than the UI, with a private storage bucket served through signed URLs.",
          },
          {
            badge: "Reporting",
            title: "jsPDF + qrcode",
            body: "Generated client-side, so an officer gets the file instantly, offline, with no server round-trip and no document service to pay for.",
          },
          {
            badge: "Delivery",
            title: "Vercel + Resend",
            body: "Custom domain, transactional mail, Google sign-in — live and reachable on any phone in the room today.",
          },
        ],
      },
    ],
    notes:
      "The rule-engine card answers 'why not just use an LLM for everything'. Explainability is a legal requirement here, not a preference.",
  },

  /* --------------------------------- 09 --------------------------------- */
  {
    id: "demo",
    no: "09",
    kicker: "Demo & screenshots",
    title: "This is the running product, not a mockup",
    blocks: [
      {
        kind: "gallery",
        items: [
          { src: "/deck/report.jpg", caption: "Verdict, citations and confidence per declaration" },
          {
            src: "/deck/declarations.jpg",
            caption: "A compliant pack, all seven declarations found",
          },
          { src: "/deck/pipeline.jpg", caption: "Every detector documented on the live site" },
        ],
      },
      {
        kind: "note",
        text: "Offline demo mode is fully hardcoded — no OCR call, no network, no database write — so the live demonstration cannot fail on venue wi-fi.",
      },
    ],
    notes:
      "Demo order: demo label first (guaranteed), then a real pack handed over by a judge. If wi-fi dies, demo mode still works.",
  },

  /* --------------------------------- 10 --------------------------------- */
  {
    id: "testing",
    no: "10",
    kicker: "Testing & validation",
    title: "What we tested, and the bugs it caught",
    blocks: [
      {
        kind: "metrics",
        items: [
          { value: "35", label: "Real label transcriptions re-run" },
          { value: "7/7", label: "Control label, confidences 68-96%" },
          { value: "0", label: "Rows a cross-user write can touch" },
          { value: "2.5-3.0s", label: "Measured OCR round-trip" },
        ],
      },
      {
        kind: "table",
        head: ["Test", "Method", "Result"],
        rows: [
          [
            "Detector correctness",
            "Positive and negative cases per declaration, including Devanagari",
            "Found 3 bugs in the country-of-origin detector: a missing case-insensitive flag, an ASCII word boundary that can never match Devanagari, and a missing 'product of' form",
          ],
          [
            "False positives",
            "Ran the engine against mock-up artwork printing 'MADE IN COUNTRY'",
            "Caught 7 false positives; added a placeholder blocklist, taking origin detection from 8/35 to 1/35 — the one label that truly declares it",
          ],
          [
            "Access control",
            "Signed in as a second account, attempted cross-user reads and writes",
            "UPDATE and DELETE on another user's inspection affect 0 rows; anonymous upload returns 403",
          ],
          [
            "Secret exposure",
            "Grepped the built client and server bundles for every key",
            "No secret values present in the shipped client bundle",
          ],
        ],
      },
      {
        kind: "note",
        text: "Honest caveat: the stored corpus is mostly stock mock-up artwork that genuinely omits MRP and manufacture date, so low detection on those fields is the validator correctly refusing blank declarations — not a miss.",
      },
    ],
    notes:
      "This slide wins the round. Most teams show a demo; very few can name the bugs their own testing caught. Say the caveat out loud before a judge finds it.",
  },

  /* --------------------------------- 11 --------------------------------- */
  {
    id: "impact",
    no: "11",
    kicker: "Impact & benefits",
    title: "Measured today, projected at scale",
    blocks: [
      {
        kind: "bars",
        caption: "Packs one inspector can check per hour",
        items: [
          { label: "Manual, by eye", value: 60, display: "~60" },
          { label: "LabelCheck, single scan", value: 600, display: "~600", accent: true },
          { label: "LabelCheck, batch of eight", value: 1200, display: "~1,200", accent: true },
        ],
      },
      {
        kind: "cards",
        cols: 4,
        items: [
          {
            badge: "Enforcement",
            title: "Ten times the packs",
            body: "An identical check every time, and a timestamped record that survives an appeal.",
          },
          {
            badge: "Industry",
            title: "Caught at proof stage",
            body: "A missing declaration found before the print run — the cost avoided is a re-print, not a fine.",
          },
          {
            badge: "Platform",
            title: "Never goes live",
            body: "Pre-listing screening means the violation never reaches a consumer at all.",
          },
          {
            badge: "Public",
            title: "Checkable by the buyer",
            body: "A public verdict link per pack, so declarations can be checked by the person paying.",
          },
        ],
      },
      {
        kind: "note",
        text: "The throughput figures are a projection from a measured 6s cycle against a one-pack-per-minute baseline, not a field study. We label it as such rather than presenting it as observed.",
      },
    ],
    notes:
      "Never present the projection as measured. Being the team that distinguishes the two is worth more than the number itself.",
  },

  /* --------------------------------- 12 --------------------------------- */
  {
    id: "plan",
    no: "12",
    kicker: "Implementation plan",
    title: "How this reaches a Legal Metrology department",
    blocks: [
      {
        kind: "timeline",
        items: [
          {
            when: "Phase 1",
            title: "Shipped",
            body: "Rule 6 engine, single and batch scanning, cited PDFs, QR share links, per-user audit history — live in production today.",
          },
          {
            when: "Phase 2",
            title: "Pilot",
            body: "One district office. Officer accounts and roles, a consolidated CSV compliance sheet for an enforcement drive.",
          },
          {
            when: "Phase 3",
            title: "Integrate",
            body: "Regional scripts, and a marketplace API so a catalogue is pre-checked before any listing goes live.",
          },
          {
            when: "Phase 4",
            title: "Scale",
            body: "State-wide rollout, MRP range cross-checks and lookups against government registration databases.",
          },
        ],
      },
      {
        kind: "note",
        text: "Phase 1 is not a promise — it is deployed and reachable at sih.anshguptaa.in right now. The remaining phases are scope, not risk.",
      },
    ],
    notes: "Emphasise that phase 1 is already done. Most teams present phase 1 as future work.",
  },

  /* --------------------------------- 13 --------------------------------- */
  {
    id: "future",
    no: "13",
    kicker: "Future scope",
    title: "Where it goes, and what we have not solved",
    blocks: [
      {
        kind: "cards",
        cols: 3,
        items: [
          {
            badge: "Languages",
            title: "Regional scripts",
            body: "Tamil, Telugu, Bengali, Marathi and Gujarati. The vision model already reads them — it is a prompt and a test set, not a rewrite.",
          },
          {
            badge: "Scale",
            title: "Whole-catalogue checks",
            body: "Bulk upload with a per-SKU compliance sheet, and listing-URL scanning for the declarations Rule 6 requires online sellers to display.",
          },
          {
            badge: "Enforcement",
            title: "Officer case files",
            body: "Roles, assignment and a case record per inspection, so a finding travels from the shelf to the hearing.",
          },
          {
            badge: "The gap",
            title: "Fraud detection",
            body: "Nothing here detects a forged but compliant-looking label. That needs MRP range checks and government registration lookups — named, not hidden.",
          },
          {
            badge: "Rules",
            title: "Beyond Rule 6",
            body: "FSSAI licence numbers, 'best before' dates and Chapter II display rules are each one new rule object.",
          },
          {
            badge: "Access",
            title: "Offline-first field app",
            body: "Queue scans without connectivity and sync when the officer is back in signal.",
          },
        ],
      },
    ],
    notes:
      "Name the forgery limit yourself, before a judge does. Volunteering the weakness is what makes the rest credible.",
  },

  /* --------------------------------- 14 --------------------------------- */
  {
    id: "team",
    no: "14",
    kicker: `Team ${DECK_META.team}`,
    title: "Team & roles",
    blocks: [
      {
        kind: "cards",
        cols: 3,
        items: [
          {
            badge: "Team leader",
            title: DECK_META.leader,
            body: "Rule engine, architecture, deployment",
          },
          { badge: "Member", title: "Dasari Aarya Nandan", body: "Frontend & interface design" },
          { badge: "Member", title: "Archi Data", body: "Research & legal mapping of Rule 6" },
          { badge: "Member", title: "Akshaj Kumar", body: "Backend & database" },
          { badge: "Member", title: "Bhumi Dwivedi", body: "Testing & validation" },
          { badge: "Member", title: "Eshan Thakur", body: "Documentation & presentation" },
        ],
      },
      {
        kind: "note",
        text: `${DECK_META.event}  ·  Problem statement ${DECK_META.problemId}  ·  ${DECK_META.ministry}`,
      },
    ],
    notes: "Adjust the role lines to match what each teammate actually owned before you present.",
  },

  /* --------------------------------- 15 --------------------------------- */
  {
    id: "conclusion",
    no: "15",
    kicker: "Conclusion",
    title: "Don't just present an idea — prove it works",
    blocks: [
      {
        kind: "cards",
        cols: 4,
        items: [
          {
            badge: "Built",
            title: "Live in production",
            body: "Deployed on our own domain, reachable from any phone in this room.",
          },
          {
            badge: "Tested",
            title: "Bugs we found ourselves",
            body: "Ten, from our own test suite — and we put them on a slide rather than hiding them.",
          },
          {
            badge: "Cited",
            title: "Every verdict traceable",
            body: "Each finding carries the exact Rule 6(1) sub-rule it derives from.",
          },
          {
            badge: "Honest",
            title: "Limits named",
            body: "We say what we do not solve, and show exactly where it sits on the roadmap.",
          },
        ],
      },
      {
        kind: "metrics",
        items: [
          { value: "7", label: "Rule 6(1) detectors shipped" },
          { value: "35", label: "Real labels validated against" },
          { value: "~6s", label: "Photo to cited verdict" },
          { value: "Live", label: "sih.anshguptaa.in" },
        ],
      },
      {
        kind: "note",
        text: "Scan a pack from your own pocket, on your own phone, at sih.anshguptaa.in — we have never seen it, and the verdict will cite its sub-rules in about six seconds.",
      },
    ],
    notes:
      "Close on the live URL. Invite a judge to scan something you have never seen. That is the moment that wins it.",
  },
];
