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
  | { kind: "lead"; text: string }
  | { kind: "stats"; items: { value: string; label: string }[] }
  | { kind: "bullets"; items: { title: string; body: string }[] }
  | { kind: "steps"; items: { title: string; body: string }[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "note"; text: string };

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

export const DECK: DeckSlide[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "title",
    no: "",
    kicker: DECK_META.event,
    title: "LabelCheck — AI-powered Legal Metrology compliance scanner",
    blocks: [
      { kind: "lead", text: "Photograph a label. Get a cited compliance verdict in seconds." },
      {
        kind: "stats",
        items: [
          { value: "7", label: "Rule 6(1) declarations verified" },
          { value: "~6s", label: "Photo to verdict, measured" },
          { value: "8", label: "Labels per batch" },
          { value: "Live", label: "sih.anshguptaa.in" },
        ],
      },
      {
        kind: "note",
        text: `${DECK_META.problemId} · ${DECK_META.ministry} · Team ${DECK_META.team}`,
      },
    ],
    notes:
      "Open by saying the product is live and can be tried on the judges' own phone right now, at sih.anshguptaa.in. This is a working system, not a mockup.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "problem",
    no: "01",
    kicker: "Problem validation",
    title: "Seven declarations, crores of packages, verified by eye",
    blocks: [
      {
        kind: "lead",
        text: "Every pre-packaged commodity sold in India must carry seven mandatory declarations under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011. Verification today is manual, one pack at a time.",
      },
      {
        kind: "bullets",
        items: [
          {
            title: "Who faces it",
            body: "Legal Metrology officers inspecting retail and warehouses; manufacturers checking artwork before a print run; e-commerce teams listing lakhs of SKUs.",
          },
          {
            title: "Why it does not scale",
            body: "A person checks roughly one pack a minute, from memory, and tires. An online catalogue of lakhs of listings cannot be eyeballed at all.",
          },
          {
            title: "Why it is inconsistent",
            body: "Two officers can reach two verdicts on the same pack. Nothing records which sub-rule was applied, so findings are hard to defend on appeal.",
          },
          {
            title: "Consequence",
            body: "Contravention attracts penalties under the Legal Metrology Act, 2009 — but only where a violation is actually found. Unchecked packaging is unpenalised packaging.",
          },
        ],
      },
    ],
    notes:
      "Do not claim a statistic you cannot source. The strength here is structural: the rules are not the bottleneck, the reading of them is.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "users",
    no: "02",
    kicker: "User requirements",
    title: "Three users, one photograph",
    blocks: [
      {
        kind: "table",
        head: ["User", "What they need", "What we give them"],
        rows: [
          [
            "Legal Metrology officer",
            "A defensible finding, in the field, on a phone",
            "Per-field verdict with the sub-rule cited, editable, exported as a signed-off PDF for the inspection file",
          ],
          [
            "Manufacturer / packer",
            "To catch a missing declaration before printing",
            "Upload the artwork proof and get the gaps listed before a run of a lakh cartons",
          ],
          [
            "E-commerce marketplace",
            "To screen listings at catalogue scale",
            "Batch checking today; the same engine behind an API for pre-listing checks",
          ],
          [
            "Consumer (secondary)",
            "To know whether a pack is lawful",
            "A public report link and QR that opens the live verdict for anyone",
          ],
        ],
      },
      {
        kind: "note",
        text: "Requirement that shaped the build: an officer must be able to correct a mis-read and have the verdict recompute — a tool that cannot be overruled will not be trusted.",
      },
    ],
    notes:
      "The correctability requirement is the one judges probe. Lead with it if asked how this survives a challenge in a hearing.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "solution",
    no: "",
    kicker: "The solution",
    title: "From a photograph to filed evidence",
    blocks: [
      {
        kind: "steps",
        items: [
          {
            title: "Capture",
            body: "Photograph the principal display panel — one pack, or up to eight at once for a batch.",
          },
          {
            title: "Extract",
            body: "A vision model transcribes every printed line server-side. Credentials never reach the browser.",
          },
          {
            title: "Apply Rule 6",
            body: "Seven independent detectors validate each declaration and score their own confidence.",
          },
          {
            title: "Cite",
            body: "Every violation is reported with its exact sub-rule and a plain-language explanation.",
          },
          {
            title: "File",
            body: "Export a cited PDF with the label photo, the raw text and a QR to the live verdict.",
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

  /* ------------------------------------------------------------------ */
  {
    id: "architecture",
    no: "03",
    kicker: "System architecture",
    title: "A five-stage pipeline, traceable end to end",
    blocks: [
      {
        kind: "steps",
        items: [
          { title: "Image", body: "Phone or upload → private Supabase bucket, signed URLs only." },
          { title: "Text extraction", body: "Server function → vision model → raw transcription." },
          { title: "Rule engine", body: "Seven detectors → found / value / strength / matchedBy." },
          { title: "Scoring", body: "Pattern strength blended with capture legibility → 0-100%." },
          { title: "Report", body: "Verdict + citations, logged to Postgres, exported as PDF." },
        ],
      },
      {
        kind: "bullets",
        items: [
          {
            title: "Stateless by design",
            body: "Nothing is held between requests, so the pipeline scales horizontally and the same code path serves one pack, a batch of eight, or an API caller.",
          },
          {
            title: "Rules are data, not code branches",
            body: "Each declaration is a self-contained rule object. Adding the FSSAI licence number or a 'best before' date is one new object, not a rewrite.",
          },
          {
            title: "Auditable at every stage",
            body: "The report exposes the raw transcription, the matched substring and which heuristic fired for each field.",
          },
        ],
      },
    ],
    notes:
      "If asked 'can you show how it works' — open /how-it-works on the live site, which renders this pipeline and every detector from the engine itself.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "tech",
    no: "04",
    kicker: "Technology selection",
    title: "Every choice has a reason",
    blocks: [
      {
        kind: "table",
        head: ["Layer", "Choice", "Why this one"],
        rows: [
          [
            "Text extraction",
            "Vision-language model, OpenAI-compatible endpoint",
            "Classical OCR fails on curved packaging, low contrast and mixed scripts. Provider is swappable via two env vars — no lock-in.",
          ],
          [
            "Rule engine",
            "Hand-written TypeScript detectors",
            "A statutory verdict must be explainable. Regex and heuristics can be read, cited and unit-tested; a classifier cannot be cross-examined.",
          ],
          [
            "App framework",
            "TanStack Start, React 19, SSR + server functions",
            "The API key stays server-side while the UI stays a single deployable. No separate backend to operate.",
          ],
          [
            "Data",
            "Supabase Postgres, row-level security, private storage",
            "Ownership enforced in the database rather than the UI, so a user can never reach another user's inspection.",
          ],
          [
            "Reporting",
            "jsPDF + qrcode, generated client-side",
            "An officer gets the file instantly, offline, with no server round-trip and no document service to pay for.",
          ],
          [
            "Delivery",
            "Vercel, custom domain, Resend for mail",
            "Live and reachable on any phone in the room today.",
          ],
        ],
      },
    ],
    notes:
      "The rule-engine row is the answer to 'why not just use an LLM for everything'. Explainability is a legal requirement here, not a preference.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "prototype",
    no: "05",
    kicker: "Working prototype",
    title: "Shipped, deployed and usable right now",
    blocks: [
      {
        kind: "lead",
        text: `Live at ${DECK_META.url} — sign in with Google or e-mail and scan a real pack from the audience.`,
      },
      {
        kind: "bullets",
        items: [
          {
            title: "Single and batch scanning",
            body: "One label, or eight at once with a live progress table and a per-label verdict.",
          },
          {
            title: "Correctable reports",
            body: "Any mis-read field is editable in place; the verdict recomputes and the correction persists.",
          },
          {
            title: "Cited PDF + QR share links",
            body: "Declarations table, violations with sub-rules, label photo, raw text and a QR to the live verdict.",
          },
          {
            title: "Per-user history",
            body: "Every inspection is logged against its owner, with authentication, e-mail verification and password reset.",
          },
          {
            title: "Offline demo mode",
            body: "Built-in labels run with no network and no database write — the demo cannot fail on venue wi-fi.",
          },
        ],
      },
    ],
    notes:
      "Demo order: demo label first (guaranteed), then a real pack from a judge. If wi-fi dies, demo mode still works.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "testing",
    no: "06",
    kicker: "Testing results",
    title: "What we tested, and the bugs it caught",
    blocks: [
      {
        kind: "table",
        head: ["Test", "Method", "Result"],
        rows: [
          [
            "Rule engine vs. real labels",
            "Re-ran all seven detectors over 35 stored label transcriptions",
            "A fully-declared control label scores 7/7 compliant, confidences 68-96%",
          ],
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
            "Latency",
            "Timed end-to-end OCR round-trips",
            "2.5-3.0s for extraction; about 6s from shutter to verdict",
          ],
          [
            "Access control",
            "Signed in as a second account and attempted cross-user reads and writes",
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
        text: "Honest caveat: the stored corpus is mostly stock mock-up artwork that genuinely omits MRP and manufacture date, so low detection on those fields is the validator correctly refusing blank declarations — not a miss. We report it this way rather than quoting a flattering headline accuracy.",
      },
    ],
    notes:
      "This slide wins the round. Most teams show a demo; very few can name the bugs their own testing caught. Say the caveat out loud before a judge finds it.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "impact",
    no: "07",
    kicker: "Impact metrics",
    title: "Measured today, projected at scale",
    blocks: [
      {
        kind: "stats",
        items: [
          { value: "~6s", label: "Photo to verdict (measured)" },
          { value: "~10×", label: "Throughput vs. a pack a minute (projected)" },
          { value: "7/7", label: "Declarations cited per inspection" },
          { value: "100%", label: "Findings carrying a sub-rule reference" },
        ],
      },
      {
        kind: "bullets",
        items: [
          {
            title: "For the enforcement officer",
            body: "Roughly ten times the packs per hour, with an identical check every time and a timestamped record that survives an appeal.",
          },
          {
            title: "For the manufacturer",
            body: "A missing declaration caught at artwork proof instead of after a print run — the cost avoided is a re-print, not a fine.",
          },
          {
            title: "For the marketplace",
            body: "Pre-listing screening means non-compliant packaging never reaches the storefront, so the violation never reaches a consumer.",
          },
          {
            title: "For the consumer",
            body: "A public verdict link per pack, so the declarations on a package can be checked by the person buying it.",
          },
        ],
      },
      {
        kind: "note",
        text: "The 10× figure is a projection from a measured 6s cycle against a one-pack-per-minute manual baseline, not a field study. We label it as such.",
      },
    ],
    notes:
      "Never present the projection as measured. Being the team that distinguishes the two is worth more than the number itself.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "legal",
    no: "",
    kicker: "Legal basis",
    title: "Seven checks, seven sub-rules",
    blocks: [
      {
        kind: "table",
        head: ["#", "Declaration", "Sub-rule"],
        rows: [
          ["1", "Manufacturer / packer / importer name and address", "Rule 6(1)(a)"],
          ["2", "Common or generic name of the commodity", "Rule 6(1)(b)"],
          ["3", "Net quantity in standard units", "Rule 6(1)(c)"],
          ["4", "Month and year of manufacture / packing", "Rule 6(1)(d)"],
          ["5", "Retail sale price, inclusive of all taxes", "Rule 6(1)(e)"],
          ["6", "Consumer care details", "Rule 6(1)(f)"],
          ["7", "Country of origin", "Rule 6(1)(g)"],
        ],
      },
      {
        kind: "note",
        text: "Framed under the Legal Metrology Act, 2009. Six declarations are verdict-critical; country of origin is mandatory for imported packages and is always reported. LabelCheck is a decision-support tool — the statutory determination remains with the officer.",
      },
    ],
    notes:
      "If a judge questions legal correctness, this slide plus the live /how-it-works page, which renders each detector, is the answer.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "edge",
    no: "",
    kicker: "Why it survives scrutiny",
    title: "Built to be challenged",
    blocks: [
      {
        kind: "bullets",
        items: [
          {
            title: "Cited, not guessed",
            body: "Every check maps to a specific sub-rule from (a) to (g), reported with the clause and a plain-language reason.",
          },
          {
            title: "Auditable, not a black box",
            body: "Per-field confidence plus the raw transcription and the matched substring, on every report.",
          },
          {
            title: "Human in the loop",
            body: "Any field is correctable; the verdict recomputes and the correction is saved against the record.",
          },
          {
            title: "Validation, not presence",
            body: "A blank price, ₹0, 0 g or an impossible date fails. Detecting the words is not the same as verifying the declaration.",
          },
          {
            title: "Presentation-proof",
            body: "Demo mode is fully hardcoded — no OCR, no network, identical on every run.",
          },
          {
            title: "Extensible",
            body: "New regulations are new rule objects. The engine does not change shape when the law does.",
          },
        ],
      },
    ],
    notes: "Six one-liners. Do not read them all — pick the two the judges have been probing.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "risks",
    no: "",
    kicker: "Feasibility & risk",
    title: "What can go wrong, and what we did about it",
    blocks: [
      {
        kind: "table",
        head: ["Risk", "Mitigation"],
        rows: [
          [
            "A forged but compliant-looking label passes",
            "Out of scope, and we say so. Rule 6 requires the declarations to be present and valid; forgery detection needs officer accounts, MRP range checks and government registration lookups. We are the scalable first line, not a fraud detector.",
          ],
          [
            "OCR misreads a blurry or curved pack",
            "Per-field confidence is shown, the raw text is exposed, and any field is correctable in place with the verdict recomputing.",
          ],
          [
            "Regional-language packaging",
            "English and Hindi with Devanagari today. The vision model already reads Tamil, Telugu, Bengali, Marathi and Gujarati — adding them is a prompt and a test set, not a rewrite.",
          ],
          [
            "Venue network failure during the demo",
            "Demo mode is fully local: hardcoded labels, no OCR call, no database write.",
          ],
          [
            "Model provider outage or price change",
            "The endpoint and model are two environment variables. Any OpenAI-compatible vision provider can be swapped in without a code change.",
          ],
          [
            "Rules change when the law changes",
            "Declarations are data. A new or amended rule is one object added to the rules array.",
          ],
        ],
      },
    ],
    notes:
      "Name the forgery limit first, before a judge does. Volunteering the weakness is what makes the rest of the deck credible.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "roadmap",
    no: "",
    kicker: "Roadmap",
    title: "From prototype to enforcement infrastructure",
    blocks: [
      {
        kind: "steps",
        items: [
          {
            title: "Now",
            body: "Single and batch scanning, cited PDFs, QR share links, per-user audit history — live in production.",
          },
          {
            title: "Next",
            body: "Regional scripts, whole-catalogue uploads with a per-SKU CSV compliance sheet for enforcement drives.",
          },
          {
            title: "Then",
            body: "A marketplace API for pre-listing checks, and listing-URL scanning for the declarations Rule 6 requires online sellers to display.",
          },
          {
            title: "Later",
            body: "Officer roles and case files, MRP range cross-checks, and lookups against government registration databases — the fraud layer.",
          },
        ],
      },
    ],
    notes: "Note that the 'later' column is exactly the forgery gap named on the risk slide.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "sustain",
    no: "",
    kicker: "Sustainability",
    title: "What it costs and who pays",
    blocks: [
      {
        kind: "bullets",
        items: [
          {
            title: "Marginal cost is one model call",
            body: "A scan is a single vision-model request plus a row in Postgres. There is no per-seat licence and no dedicated hardware.",
          },
          {
            title: "Government deployment",
            body: "Free at the point of use for Legal Metrology officers, funded as enforcement infrastructure — the cost of an inspection falls rather than rises.",
          },
          {
            title: "Commercial deployment",
            body: "Per-check API pricing for marketplaces and manufacturers pre-screening catalogues at volume.",
          },
          {
            title: "Runs on free tiers today",
            body: "The live deployment costs nothing beyond model usage, which is what makes a nationwide pilot practical rather than aspirational.",
          },
        ],
      },
    ],
    notes:
      "Only raise pricing if asked. The point to land is that the marginal cost per inspection is a fraction of a rupee.",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "team",
    no: "",
    kicker: `Team ${DECK_META.team}`,
    title: "Built by six, shipped to production",
    blocks: [
      {
        kind: "lead",
        text: `${DECK_META.event} · Problem statement ${DECK_META.problemId} · ${DECK_META.ministry}`,
      },
      {
        kind: "bullets",
        items: [
          { title: "Team leader", body: DECK_META.leader },
          { title: "Members", body: DECK_META.members.join(" · ") },
          {
            title: "Try it now",
            body: `${DECK_META.url} — scan a pack from your own pocket, on your own phone.`,
          },
        ],
      },
      {
        kind: "note",
        text: "Don't just present an idea. We built it, tested it, found our own bugs, and fixed them.",
      },
    ],
    notes: "Close on the live URL. Invite a judge to scan something you have never seen.",
  },
];
