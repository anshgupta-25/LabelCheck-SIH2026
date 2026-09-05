/**
 * LabelCheck rule engine
 * ----------------------
 * Implements the seven mandatory declarations required on every pre-packaged
 * commodity sold in India under Rule 6 of the Legal Metrology (Packaged
 * Commodities) Rules, 2011, framed under the Legal Metrology Act, 2009.
 *
 * The engine is deliberately modular: each rule is a self-contained
 * `RuleDefinition` with its own detector. Adding a new declaration (e.g. FSSAI
 * licence number, "best before" for food articles under Rule 6(1)(f)) is a
 * matter of appending one object to `RULES` — no other file changes.
 *
 * Every detector returns:
 *   - found      : whether the declaration is present
 *   - value      : the exact substring extracted from the OCR text
 *   - confidence : 0-100, derived from pattern strength (how specific the match
 *                  was) blended with the OCR quality signal for the page
 */

export type RuleKey =
  | "manufacturer"
  | "commodity_name"
  | "net_quantity"
  | "manufacture_date"
  | "mrp"
  | "consumer_care"
  | "country_of_origin";

export interface RuleDefinition {
  key: RuleKey;
  /** Short label shown in the checklist */
  label: string;
  /** Statutory citation, e.g. "Rule 6(1)(e)" */
  ruleRef: string;
  /** Plain-language legal requirement, used for the info tooltip */
  requirement: string;
  /** Explanation shown when the declaration is missing */
  violation: string;
  /**
   * Only declarations 1-6 are treated as verdict-critical. Country of origin is
   * mandatory for imported packages (Rule 6(1)(g)) and is reported, but a
   * domestically packed commodity is not failed for it.
   */
  critical: boolean;
  detect: (text: string) => DetectionOutcome;
}

export interface DetectionOutcome {
  found: boolean;
  value: string | null;
  /** Raw pattern strength, 0-1, before OCR quality is factored in */
  strength: number;
  /** Which heuristic fired — surfaced in the audit panel */
  matchedBy?: string | undefined;
}

export interface FieldResult {
  key: RuleKey;
  label: string;
  ruleRef: string;
  requirement: string;
  violation: string;
  critical: boolean;
  found: boolean;
  value: string | null;
  confidence: number;
  matchedBy?: string | undefined;
  /** True when a human corrected this field in the report UI */
  edited?: boolean | undefined;
}

export type Verdict = "compliant" | "non_compliant";

export interface ComplianceReport {
  verdict: Verdict;
  fields: FieldResult[];
  score: number;
  missingCritical: FieldResult[];
  ocrQuality: number;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const clean = (text: string) => text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ");

function firstMatch(
  text: string,
  patterns: { re: RegExp; strength: number; name: string }[],
): DetectionOutcome {
  for (const { re, strength, name } of patterns) {
    const m = re.exec(text);
    if (m) {
      return {
        found: true,
        value: (m[0] || "").trim().replace(/\s+/g, " ").slice(0, 160),
        strength,
        matchedBy: name,
      };
    }
  }
  return { found: false, value: null, strength: 0 };
}

const MONTHS =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

/** A detection that turned out to be meaningless (zero, blank, stray char). */
const invalid = (): DetectionOutcome => ({ found: false, value: null, strength: 0 });

/** Extracts the first numeric literal in a string, tolerating comma decimals. */
function firstNumber(value: string | null): number | null {
  if (!value) return null;
  const m = /\d+(?:[.,]\d+)?/.exec(value);
  if (!m) return null;
  const n = Number(m[0].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** True when a value carries enough real content to count as a declaration. */
function isMeaningful(value: string | null, minLetters = 3): boolean {
  if (!value) return false;
  const letters = (value.match(/[A-Za-z\u0900-\u097F]/g) || []).length;
  return value.trim().length >= minLetters && letters >= minLetters;
}

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/**
 * A manufacture date only counts if it resolves to a real month (1-12) and a
 * plausible year (1990 … next year). "MFD 00/0000" or "13/2025" are rejected.
 */
function isPlausibleDate(value: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  const maxYear = new Date().getFullYear() + 1;

  const named = new RegExp(
    `\\b(${MONTH_NAMES.join("|")})[a-z]*[\\s.\\-\\/]*((?:19|20)\\d{2})\\b`,
  ).exec(v);
  if (named) {
    const year = Number(named[2]);
    return year >= 1990 && year <= maxYear;
  }

  const numeric = /\b(\d{1,2})[\/\-.](\d{2,4})\b/.exec(v);
  if (numeric) {
    const month = Number(numeric[1]);
    let year = Number(numeric[2]);
    if (year < 100) year += 2000;
    return month >= 1 && month <= 12 && year >= 1990 && year <= maxYear;
  }
  return false;
}

/**
 * Countries that realistically appear on Indian retail packaging. Used to keep
 * "Made in small batches" or "Made in a facility that…" from being mistaken for
 * a country-of-origin declaration.
 */
const COUNTRY_WORDS = new Set(
  [
    "india",
    "china",
    "nepal",
    "bhutan",
    "bangladesh",
    "sri lanka",
    "pakistan",
    "thailand",
    "vietnam",
    "indonesia",
    "malaysia",
    "singapore",
    "philippines",
    "japan",
    "korea",
    "taiwan",
    "uae",
    "united arab emirates",
    "saudi arabia",
    "usa",
    "united states",
    "america",
    "uk",
    "united kingdom",
    "england",
    "germany",
    "france",
    "italy",
    "spain",
    "netherlands",
    "belgium",
    "poland",
    "switzerland",
    "sweden",
    "denmark",
    "turkey",
    "russia",
    "australia",
    "new zealand",
    "canada",
    "mexico",
    "brazil",
    "egypt",
    "kenya",
    "nigeria",
    "south africa",
  ].map((c) => c),
);

/** True when the words after "Made in" look like a country rather than prose. */
function looksLikeCountry(raw: string): boolean {
  const value = raw.trim().replace(/[.,;].*$/, "");
  if (COUNTRY_WORDS.has(value.toLowerCase())) return true;
  // Otherwise accept a capitalised proper noun ("MADE IN INDIA", "Made in Nepal")
  // but never lower-case prose ("made in small batches").
  return /^[A-Z][A-Za-z]{2,}(?: [A-Z][A-Za-z]+)?$/.test(value);
}

/* ------------------------------------------------------------------ */
/* Rule definitions — Rule 6(1)(a) … 6(1)(g)                           */
/* ------------------------------------------------------------------ */

export const RULES: RuleDefinition[] = [
  {
    key: "manufacturer",
    label: "Manufacturer / Packer / Importer",
    ruleRef: "Rule 6(1)(a)",
    requirement:
      "The name and complete address of the manufacturer, packer or importer must appear on the principal display panel. For imported goods, the importer's name and address is mandatory.",
    violation:
      "Rule 6(1)(a): The package does not declare the name and complete address of the manufacturer, packer or importer.",
    critical: true,
    detect: (text) => {
      // Heuristic 1: an explicit "Manufactured by / Packed by / Marketed by" lead-in.
      const lead =
        /(manufactured|mfd|mfg|packed|packaged|marketed|imported)\s*(&|and)?\s*(by|by:)?\s*[:\-]?\s*([^\n]{8,140})/i.exec(
          text,
        );
      // Heuristic 2: an Indian postal address signature (PIN code + place words).
      const pin = /\b\d{6}\b/.test(text);
      const addressWords =
        /(pvt\.?\s*ltd|private limited|limited|ltd\.?|industries|foods|company|road|street|nagar|dist(?:rict)?|state|india)/i.test(
          text,
        );

      if (lead) {
        const name = (lead[4] || "").replace(/\s+/g, " ").trim();
        // A lead-in followed by a stray character is not a declaration.
        if (!isMeaningful(name, 4)) return invalid();
        const value = (lead[0] || "").replace(/\s+/g, " ").trim().slice(0, 160);
        return {
          found: true,
          value,
          strength: pin ? 0.98 : addressWords ? 0.86 : 0.7,
          matchedBy: pin ? "declaration lead-in + PIN code" : "declaration lead-in",
        };
      }
      if (pin && addressWords) {
        const around = /([^\n]{0,90}\b\d{6}\b[^\n]{0,30})/.exec(text);
        const value = (around?.[0] || "").replace(/\s+/g, " ").trim().slice(0, 160);
        if (!isMeaningful(value, 6)) return invalid();
        return {
          found: true,
          value,
          strength: 0.66,
          matchedBy: "address heuristic (PIN code + entity keywords)",
        };
      }
      return { found: false, value: null, strength: 0 };
    },
  },
  {
    key: "commodity_name",
    label: "Common / Generic name of commodity",
    ruleRef: "Rule 6(1)(b)",
    requirement:
      "The common or generic name of the commodity contained in the package must be declared — a brand name alone is not sufficient.",
    violation:
      "Rule 6(1)(b): The common or generic name of the commodity is not declared. A brand name by itself does not satisfy this requirement.",
    critical: true,
    detect: (text) => {
      const explicit = /(?:product|commodity|generic|common)\s*name\s*[:\-]\s*([^\n]{2,60})/i.exec(
        text,
      );
      if (explicit) {
        const value = (explicit[1] || "").trim();
        if (isMeaningful(value, 3)) {
          return {
            found: true,
            value,
            strength: 0.97,
            matchedBy: "explicit 'name' declaration",
          };
        }
      }
      // Fallback: a recognised generic food/consumer commodity noun.
      const generic =
        /\b(?:(?:refined|edible|mustard|sunflower|groundnut|coconut|olive|soyabean|soybean|palm|sesame|rice bran)\s+)?(?:oil|biscuits?|cookies?|namkeen|snacks?|chips|wafers?|tea|coffee|rice|atta|flour|wheat|sugar|salt|spices?|masala|powder|ghee|butter|milk|curd|yoghurt|paneer|cheese|chocolate|candy|juice|beverage|drinking water|mineral water|soap|detergent|shampoo|toothpaste|handwash|sanitizer|lotion|cream|honey|pickle|jam|noodles|pasta|dal|pulses|cereal|oats|water)\b/i.exec(
          text,
        );
      if (generic) {
        return {
          found: true,
          value: generic[0],
          strength: 0.8,
          matchedBy: "generic commodity vocabulary",
        };
      }
      return invalid();
    },
  },
  {
    key: "net_quantity",
    label: "Net quantity",
    ruleRef: "Rule 6(1)(c)",
    requirement:
      "Net quantity must be declared in standard units — gram (g), kilogram (kg), millilitre (ml), litre (L) — or by number (N/U) for countable articles, excluding the weight of the wrapper.",
    violation:
      "Rule 6(1)(c): Net quantity is not declared as a positive amount in the prescribed standard units of weight, measure or number.",
    critical: true,
    detect: (text) => {
      // Every candidate is scanned; a zero or blank quantity (e.g. "0 g") is
      // never a valid declaration, so the search continues past it.
      const patterns: { re: RegExp; strength: number; name: string }[] = [
        {
          re: /net\s*(?:qty|quantity|wt\.?|weight|vol(?:ume)?)?\s*[:\-]?\s*\d+(?:[.,]\d+)?\s*(?:g|gm|gms|gram|grams|kg|kgs|ml|mls|l|ltr|litre|liter|n|u|pcs|pieces)\b/gi,
          strength: 0.98,
          name: "'Net quantity' declaration with unit",
        },
        {
          re: /\b\d+(?:[.,]\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|liter)\b(?:\s*[eE])?/g,
          strength: 0.78,
          name: "standard unit quantity pattern",
        },
        {
          re: /\b\d+\s*(?:N|U|pcs|pieces|units?)\b/gi,
          strength: 0.72,
          name: "declaration by number",
        },
      ];

      for (const { re, strength, name } of patterns) {
        for (const m of text.matchAll(re)) {
          const value = (m[0] || "").trim().replace(/\s+/g, " ");
          const qty = firstNumber(value);
          if (qty !== null && qty > 0) {
            return { found: true, value, strength, matchedBy: name };
          }
        }
      }
      return invalid();
    },
  },
  {
    key: "manufacture_date",
    label: "Month & year of manufacture / packing",
    ruleRef: "Rule 6(1)(d)",
    requirement:
      "The month and year in which the commodity was manufactured, pre-packed or imported must be declared. The day is optional; the month and year are not.",
    violation:
      "Rule 6(1)(d): A plausible month and year of manufacture, packing or import is not declared on the package.",
    critical: true,
    detect: (text) => {
      const outcome = firstMatch(text, [
        {
          re: new RegExp(
            `(?:mfd|mfg|manufactured|packed|pkd|date of (?:manufacture|packing))\\s*(?:on|date)?\\s*[:.\\-]?\\s*(?:\\d{1,2}[\\/\\-.])?(?:\\d{1,2}|${MONTHS})[\\/\\-.\\s]+\\d{2,4}`,
            "i",
          ),
          strength: 0.98,
          name: "labelled manufacture/packing date",
        },
        {
          re: new RegExp(`\\b(?:${MONTHS})[\\s.\\-\\/]*\\d{4}\\b`, "i"),
          strength: 0.8,
          name: "month-name + year",
        },
        {
          re: /\b(0?[1-9]|1[0-2])[\/\-.](20\d{2}|\d{2})\b/,
          strength: 0.7,
          name: "MM/YYYY pattern",
        },
      ]);
      if (!outcome.found) return outcome;
      return isPlausibleDate(outcome.value) ? outcome : invalid();
    },
  },
  {
    key: "mrp",
    label: "Retail sale price (MRP, inclusive of all taxes)",
    ruleRef: "Rule 6(1)(e)",
    requirement:
      "The retail sale price must be declared as 'Maximum Retail Price ₹ … inclusive of all taxes'. The price shown must be the all-inclusive price a consumer pays.",
    violation:
      "Rule 6(1)(e): MRP must be displayed as a positive maximum retail price inclusive of all taxes. No valid retail sale price declaration was detected.",
    critical: true,
    detect: (text) => {
      const inclusive = /incl(?:usive)?\.?\s*(?:of)?\s*all\s*taxes/i.test(text);
      const patterns: { re: RegExp; strength: number; name: string }[] = [
        {
          re: /(?:m\.?\s*r\.?\s*p\.?|maximum retail price)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*\d+(?:[.,]\d{1,2})?\s*\/?-?/gi,
          strength: 0.98,
          name: "MRP declaration",
        },
        {
          re: /(?:₹|rs\.?|inr)\s*\d+(?:[.,]\d{1,2})?\s*\/?-?/gi,
          strength: 0.74,
          name: "rupee price pattern",
        },
      ];

      for (const { re, strength, name } of patterns) {
        for (const m of text.matchAll(re)) {
          const value = (m[0] || "").trim().replace(/\s+/g, " ");
          const price = firstNumber(value);
          // ₹0 or a blank price is not a retail sale price declaration.
          if (price === null || price <= 0) continue;
          return {
            found: true,
            value,
            strength: inclusive ? Math.min(1, strength + 0.02) : strength * 0.85,
            matchedBy: inclusive
              ? `${name} + 'inclusive of all taxes'`
              : `${name} (no 'inclusive of all taxes' wording)`,
          };
        }
      }
      return invalid();
    },
  },
  {
    key: "consumer_care",
    label: "Consumer care details",
    ruleRef: "Rule 6(1)(f)",
    requirement:
      "The name, address, telephone number and e-mail address (where available) of the person who can be contacted for consumer complaints must be declared.",
    violation:
      "Rule 6(1)(f): Consumer care details (contact phone number and/or e-mail for complaints) are not declared.",
    critical: true,
    detect: (text) => {
      const email = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.exec(text);
      const phone =
        /(?:\+91[\-\s]?)?(?:1800[\-\s]?\d{3}[\-\s]?\d{3,4}|\b[6-9]\d{9}\b|\b\d{3,5}[\-\s]\d{6,8}\b)/.exec(
          text,
        );
      const labelled = /(customer|consumer)\s*(care|service|complaints?)/i.test(text);

      if (email && phone) {
        return {
          found: true,
          value: `${phone[0].trim()} · ${email[0].trim()}`,
          strength: labelled ? 0.99 : 0.94,
          matchedBy: "phone + e-mail detected",
        };
      }
      if (email) {
        return {
          found: true,
          value: email[0].trim(),
          strength: labelled ? 0.9 : 0.82,
          matchedBy: "e-mail detected",
        };
      }
      if (phone) {
        return {
          found: true,
          value: phone[0].trim(),
          strength: labelled ? 0.9 : 0.78,
          matchedBy: "phone number detected",
        };
      }
      return { found: false, value: null, strength: 0 };
    },
  },
  {
    key: "country_of_origin",
    label: "Country of origin",
    ruleRef: "Rule 6(1)(g)",
    requirement:
      "The country of origin or manufacture or assembly must be declared on the package. It is mandatory for imported packages and for goods offered for sale through e-commerce.",
    violation:
      "Rule 6(1)(g): Country of origin is not declared. This is mandatory for imported packages and for e-commerce listings.",
    critical: false,
    detect: (text) => {
      const explicit = firstMatch(text, [
        {
          re: /country\s*of\s*(?:origin|manufacture|assembly)\s*[:\-]?\s*[A-Za-z\u0900-\u097F ]{3,30}/i,
          strength: 0.99,
          name: "explicit country of origin declaration",
        },
        { re: /भारत\s*में\s*निर्मित/, strength: 0.9, name: "Hindi 'Made in India' declaration" },
      ]);
      if (explicit.found) return explicit;

      // "MADE IN INDIA" is printed in capitals on a large share of Indian packs,
      // so this must be case-insensitive; the country check keeps prose out.
      for (const m of text.matchAll(
        /\b(?:made|manufactured|packed|produced|product)\s+(?:in|of)\s+([A-Za-z][A-Za-z ]{2,24})/gi,
      )) {
        const country = (m[1] || "").trim().replace(/[.,;].*$/, "");
        if (!looksLikeCountry(country)) continue;
        return {
          found: true,
          value: (m[0] || "").trim().replace(/\s+/g, " ").slice(0, 160),
          strength: COUNTRY_WORDS.has(country.toLowerCase()) ? 0.9 : 0.8,
          matchedBy: "'Made in …' declaration",
        };
      }
      return invalid();
    },
  },
];

/* ------------------------------------------------------------------ */
/* Confidence model                                                    */
/* ------------------------------------------------------------------ */

/**
 * Estimates how legible the OCR output is, on a 0-1 scale. Short output or a
 * high proportion of non-alphanumeric noise indicates a poor capture, which
 * damps every per-field confidence score.
 */
export function estimateOcrQuality(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  const alnum = (t.match(/[a-z0-9\u0900-\u097F]/gi) || []).length;
  const ratio = alnum / t.length;
  const lengthScore = Math.min(1, t.length / 220);
  return Math.max(0.35, Math.min(1, 0.45 * lengthScore + 0.55 * ratio));
}

/** Blends pattern strength with OCR quality into a displayed percentage. */
function toConfidence(strength: number, ocrQuality: number): number {
  if (strength <= 0) return 0;
  const blended = strength * (0.78 + 0.22 * ocrQuality);
  return Math.round(Math.max(0, Math.min(1, blended)) * 100);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function analyseLabel(rawText: string): ComplianceReport {
  const text = clean(rawText || "");
  const ocrQuality = estimateOcrQuality(text);

  const fields: FieldResult[] = RULES.map((rule) => {
    const outcome = rule.detect(text);
    // A field only counts as found when it also carries a real value.
    const found = outcome.found && !!outcome.value?.trim();
    return {
      key: rule.key,
      label: rule.label,
      ruleRef: rule.ruleRef,
      requirement: rule.requirement,
      violation: rule.violation,
      critical: rule.critical,
      found,
      value: found ? outcome.value : null,
      // Not found always reads 0% — icon, status and number never disagree.
      confidence: found ? toConfidence(outcome.strength, ocrQuality) : 0,
      matchedBy: found ? outcome.matchedBy : undefined,
    };
  });

  return finaliseReport(fields, ocrQuality);
}

/**
 * Recomputes the verdict from a (possibly human-corrected) field list, so the
 * inspector's edits immediately drive the outcome.
 */
/**
 * Guarantees icon / status / confidence always agree: a field without a real
 * value is "not found" at 0%. Also repairs rows persisted before this rule.
 */
export function normaliseFields(fields: FieldResult[]): FieldResult[] {
  return fields.map((f) => {
    const value = f.value?.trim() || null;
    const found = f.found && !!value;
    return {
      ...f,
      value: found ? value : null,
      found,
      confidence: found ? Math.max(1, Math.round(f.confidence)) : 0,
      matchedBy: found ? f.matchedBy : undefined,
    };
  });
}

export function finaliseReport(input: FieldResult[], ocrQuality: number): ComplianceReport {
  const fields = normaliseFields(input);
  const missingCritical = fields.filter((f) => f.critical && !f.found);
  const present = fields.filter((f) => f.found).length;
  return {
    verdict: missingCritical.length === 0 ? "compliant" : "non_compliant",
    fields,
    score: Math.round((present / fields.length) * 100),
    missingCritical,
    ocrQuality,
  };
}

/** Applies a manual correction from the report UI and re-derives the verdict. */
export function applyCorrection(fields: FieldResult[], key: RuleKey, value: string): FieldResult[] {
  return fields.map((f) => {
    if (f.key !== key) return f;
    const trimmed = value.trim();
    return {
      ...f,
      value: trimmed || null,
      found: trimmed.length > 0,
      // A human-verified value is authoritative.
      confidence: trimmed.length > 0 ? 100 : 0,
      matchedBy: trimmed.length > 0 ? "manually verified by inspector" : undefined,
      edited: true,
    };
  });
}

export const LEGAL_BASIS = {
  act: "Legal Metrology Act, 2009",
  rules: "Legal Metrology (Packaged Commodities) Rules, 2011",
  clause: "Rule 6 — Declarations to be made on every package",
};
