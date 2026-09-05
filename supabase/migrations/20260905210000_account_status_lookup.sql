-- Lets the sign-in pages tell a visitor whether an address has an account,
-- so "forgot password" can say "no account yet — sign up" instead of silently
-- pretending to send a mail. Returns only a coarse status, never user data.
--   'none'        — no account with this address
--   'unconfirmed' — signed up but the e-mail was never confirmed
--   'active'      — usable account
CREATE OR REPLACE FUNCTION public.account_status(check_email text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT CASE WHEN u.email_confirmed_at IS NULL THEN 'unconfirmed' ELSE 'active' END
      FROM auth.users u
      WHERE lower(u.email) = lower(btrim(check_email))
        AND u.deleted_at IS NULL
      LIMIT 1
    ),
    'none'
  );
$$;

REVOKE ALL ON FUNCTION public.account_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.account_status(text) TO anon, authenticated;
