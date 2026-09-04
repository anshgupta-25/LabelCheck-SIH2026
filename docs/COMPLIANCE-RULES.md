# The 7 Mandatory Declarations

Source: **Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011**, framed
under the **Legal Metrology Act, 2009**. Every pre-packaged commodity sold in
India must carry these on the principal display panel.

---

## 1. Manufacturer / packer / importer — name and address · Rule 6(1)(a)

The complete name and address of the manufacturer, packer or importer must
appear on the pack.

- Detected via declaration lead-ins (`Manufactured by`, `Packed by`,
  `Marketed by`, `Imported by`) plus address heuristics such as a 6-digit PIN.
- Higher confidence when a PIN code is present.
- Fails on stray characters or an empty capture.

## 2. Common or generic name of the commodity · Rule 6(1)(b)

What the product actually *is* — "Biscuits", "Namkeen", "Refined Sunflower Oil"
— not just the brand name.

- Highest confidence on an explicit `Common name:` declaration.
- Fallback to a generic commodity vocabulary match.

## 3. Net quantity · Rule 6(1)(c)

Net quantity in standard units — g, kg, ml, L, or number of units (N / pcs).

- Must be a **positive** number followed by a valid unit.
- `0 g`, `0 ml`, `Net Wt.` with no figure, or a bare unit **fail**.
- Weight of packaging must be excluded — net, not gross.

## 4. Month and year of manufacture / packing · Rule 6(1)(d)

Examples: `MFD 03/2025`, `Mfg: Jan 2025`, `Packed: 03-2025`.

- Must resolve to a plausible month and a year inside a sane range.
- A date alone without a manufacture/packing label scores lower confidence.

## 5. Retail sale price (MRP) inclusive of all taxes · Rule 6(1)(e)

Examples: `MRP ₹120`, `M.R.P. Rs. 45.00/- (inclusive of all taxes)`.

- Must be a **positive** rupee amount; `₹0` or a blank price fails.
- Presence of "inclusive of all taxes" raises confidence.

## 6. Consumer care details · Rule 6(1)(f)

A contact for complaints — name/designation plus a phone number and/or e-mail.

- Detected via phone and e-mail patterns near consumer-care vocabulary.
- Both phone and e-mail present gives the highest confidence.

## 7. Country of origin · Rule 6(1)(g)

Mandatory for imported commodities and standard practice on domestic packs.

- Detected via an explicit `Country of Origin` declaration.
- Treated as advisory in the verdict: its absence is reported but, for domestic
  packs, does not by itself make the product non-compliant.

---

## Verdict logic

```text
NON-COMPLIANT  if any of declarations 1–6 is missing or fails validation
COMPLIANT      otherwise
```

Every violation is reported with its sub-rule reference and a plain-language
explanation, e.g.

> **Rule 6(1)(e):** MRP must be displayed inclusive of all taxes.

## Penalties (context for officers)

Contravention of the packaged-commodities provisions attracts penalties under
the Legal Metrology Act, 2009 — this tool is an inspection aid, not a legal
determination. The officer's finalized, corrected report is the record.
