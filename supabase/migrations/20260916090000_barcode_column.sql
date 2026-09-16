-- Barcode detection result for a scan.
--
-- Nullable and additive: every existing row keeps working with NULL, and the
-- label check runs identically whether or not a barcode was found. The column
-- holds the detection result, the product-database lookup and the
-- cross-check rows, which are an identity signal only — they never contribute
-- to the Rule 6 compliance verdict.
--
-- Shape:
-- {
--   "detected": true,
--   "value": "8901764082405",
--   "format": "EAN-13",
--   "confidence": null,
--   "lookup": { "status": "found", "message": "...", "product": { ... } },
--   "crossChecks": [ { "label": "Brand", "status": "match", ... } ]
-- }
alter table public.scans
  add column if not exists barcode jsonb;

comment on column public.scans.barcode is
  'Barcode detection, product lookup and cross-check results. Informational only - does not affect the Rule 6 verdict.';

-- Lets an officer find every inspection of the same product code.
create index if not exists scans_barcode_value_idx
  on public.scans ((barcode ->> 'value'))
  where barcode is not null;
