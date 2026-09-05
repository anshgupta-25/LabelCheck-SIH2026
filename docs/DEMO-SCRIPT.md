# Demo Script (4 minutes)

Rehearse out loud, as a team, at least twice. Confidence beats slides.

## Before you walk in

- [ ] App open in a fresh tab at `/`. **Demo Mode is genuinely offline**: both
      sample reports render from hardcoded fixtures with no OCR, no upload, no
      database and no sign-in. They work on a dead venue network.
- [ ] Signed in on a second tab, so `/scan`, `/history` and PDF export are ready
      without fumbling a login on stage.
- [ ] Two or three label photos on the desktop for the live batch scan.
- [ ] Second tab on `/pitch`, phone hotspot as backup, notifications off, zoom 100%.

## Timeline

| Time | Screen | What you say |
| --- | --- | --- |
| 0:00 | Home | "Every packaged product in India must carry 7 declarations under Rule 6. Today an officer checks them by hand, about one product a minute." |
| 0:25 | Home → **Try a Demo** | "No sign-up needed to see it work." Lands straight on a cited report. |
| 0:45 | Report | "Verdict: NON-COMPLIANT. Four mandatory declarations missing, each with the exact sub-rule cited." |
| 1:05 | Expand raw text | "Not a black box. Here's the raw extraction and the per-field confidence." |
| 1:25 | Edit a field | "An officer corrects a misread before finalising. Human in the loop, and the verdict recomputes live." |
| 1:45 | **Download PDF** | "One click gives an officer-ready PDF: declarations table, violations with sub-rules, the photo, the raw text, and a QR code back to the live verdict." |
| 2:10 | `/scan` — drop 3 photos | "Same engine at catalogue scale. Each label is stamped as it completes." |
| 2:40 | Batch table | "One table of verdicts with the missing declarations listed. This is the pre-listing check an e-commerce team runs." |
| 3:00 | History | "Every inspection is logged under the officer's own account. That's the audit trail." |
| 3:20 | How it works | "Image, OCR, rule engine, cited report. Rules are data, so a new declaration is one object, not a rewrite." |
| 3:40 | — | Close: "Scalable, transparent and legally grounded enforcement." |

## Fallbacks

- **No internet:** stay entirely in Demo Mode. `/report/demo-compliant` and
  `/report/demo-non-compliant` are built in the browser and need no network,
  no account and no database. Field editing still works; it just isn't saved.
- **Live scan misreads:** that's the point. Show the confidence drop and correct
  the field by hand.
- **A judge wants to try it:** send them to **Try a Demo** on the home page. It
  needs no account. Signing up needs an e-mail code, which takes a minute.
- **App won't load:** open `/pitch` on a second device, or present from an
  exported PDF of the deck.

## Numbers you can defend

- **~3 seconds** for the vision model to transcribe a label (measured).
- **~6 seconds** end to end from photo to verdict, including upload and saving.
- **8 labels** per batch, one table of verdicts.
- **7 declarations**, every one mapped to a Rule 6(1) sub-clause.

Never quote an accuracy percentage you haven't measured. "We show per-field
confidence and the raw text" is a stronger answer than a made-up number.
