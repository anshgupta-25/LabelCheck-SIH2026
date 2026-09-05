# Database & Migrations

Everything about the backend lives in version control, so a fresh environment
can be rebuilt from this repository alone.

```text
supabase/
├── config.toml                    # project reference id
└── migrations/                    # ordered, immutable SQL history
    ├── 20260902065421_...sql      # scans table + grants + RLS + policies + index
    ├── 20260902065449_...sql      # storage policies for the label-images bucket
    └── 20260905103000_...sql      # creates the private label-images bucket
```

---

## Golden rules

1. **Migrations are append-only.** Never edit or delete a file that has already
   been applied to any environment. Fix mistakes with a *new* migration.
2. **One logical change per migration.** Easier to review, easier to revert.
3. **Filenames are `<UTC timestamp>_<slug>.sql`** — the timestamp defines the
   apply order. `20260904T071500` → `20260904071500_add_officer_notes.sql`.
4. **Every `CREATE TABLE` in `public` ships its `GRANT`s in the same file.**
   Row-level security alone is not enough; without grants the Data API returns
   a permission error.
5. **Buckets are created in SQL too.** Insert into `storage.buckets` and commit
   the matching `storage.objects` policies as migrations (see the second and
   third migrations above), so a fresh project needs no manual dashboard steps.

## The required order inside a migration

```sql
-- 1. schema
CREATE TABLE public.<name> ( ... );

-- 2. grants  (drop anon when every policy scopes to auth.uid())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
GRANT ALL ON public.<name> TO service_role;

-- 3. row-level security
ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;

-- 4. policies
CREATE POLICY "..." ON public.<name> FOR SELECT TO authenticated USING (...);
```

Getting the order wrong is the single most common cause of "it works locally
but the deployed app can't read the table".

## Current schema

### `public.scans`

| Column | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | uuid | `gen_random_uuid()` | primary key |
| `created_at` | timestamptz | `now()` | indexed `DESC` for the history page |
| `image_url` | text | – | object path in the private bucket, nullable for demo rows |
| `extracted_text` | text | `''` | raw OCR transcription |
| `language` | text | `'eng'` | `eng` or `hin` |
| `verdict` | text | `'non_compliant'` | `compliant` or `non_compliant` |
| `product_name` | text | – | best-effort title |
| `source` | text | `'upload'` | `upload` or `demo` |
| `field_results` | jsonb | `'[]'` | array of `{key, label, ruleRef, found, value, confidence}` |

**Access:** the app is a public inspection tool, so all four operations are open
to `anon` and `authenticated`. If officer accounts are added, replace the
`USING (true)` policies with `auth.uid()`-scoped ones and add an `owner_id`
column — in a new migration.

### Storage — bucket `label-images`

Private bucket. Images are read through short-lived signed URLs, never a public
URL. Insert and select policies on `storage.objects` are scoped to
`bucket_id = 'label-images'`.

---

## Adding a future migration

1. Write the SQL in a new timestamped file under `supabase/migrations/`.
2. Apply it to the project (CLI below, or paste into the dashboard SQL editor).
3. Regenerate `src/integrations/supabase/types.ts` and commit it **together
   with** the migration. Never hand-edit `types.ts` — it is generated.

With the Supabase CLI:

```sh
supabase link --project-ref <project-ref>
supabase migration new add_officer_notes      # creates the timestamped file
# edit the file, then:
supabase db push
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Rebuilding a brand-new environment

```sh
# 1. create a new Supabase project, note its ref
supabase link --project-ref <new-ref>

# 2. apply the full history in order
supabase db push

# 3. set the env vars from .env.example to the new project's values

# 4. regenerate types and run
supabase gen types typescript --linked > src/integrations/supabase/types.ts
npm run dev
```

Nothing else is required — there is no seed data the app depends on, because
Demo Mode is entirely hardcoded in `src/lib/demo-labels.ts`.

## Migration checklist

- [ ] New file, never an edit to an applied one
- [ ] Timestamp prefix is later than every existing file
- [ ] `GRANT`s present for every new public table
- [ ] RLS enabled and at least one policy per operation the app performs
- [ ] Defaults / `NOT NULL` chosen so existing inserts keep working
- [ ] Time-dependent rules use triggers, not `CHECK` constraints
- [ ] Regenerated `types.ts` committed in the same change
- [ ] App still builds: `npm run build`
