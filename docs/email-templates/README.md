# Supabase auth e-mail templates

Branded versions of every e-mail Supabase Auth sends, sharing the design of the
app's own mail in `src/lib/email.server.ts`. Each includes the six-digit code
(`{{ .Token }}`) as well as the link, so OTP-style flows work too.

**Apply:** Supabase dashboard → Authentication → Email Templates → pick the template
named in the first column → paste the file's HTML into *Message body* and set the
*Subject*. Site URL (Authentication → URL configuration) must be the public app URL
so the logo and footer links resolve.

| Dashboard template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Confirm your LabelCheck account |
| Invite user | `invite-user.html` | You've been invited to LabelCheck |
| Magic Link | `magic-link.html` | Your LabelCheck sign-in link |
| Change Email Address | `change-email.html` | Confirm your new LabelCheck e-mail |
| Reset Password | `reset-password.html` | Reset your LabelCheck password |
| Reauthentication | `reauthentication.html` | Your LabelCheck verification code |
