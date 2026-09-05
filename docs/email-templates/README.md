# Supabase auth e-mail templates

Branded versions of the e-mails Supabase Auth sends. Paste each file's HTML into
**Supabase dashboard → Authentication → Email Templates** and set the subject shown.
They use Supabase's template variables ({{ .ConfirmationURL }}, {{ .Email }},
{{ .NewEmail }}, {{ .SiteURL }}) and share the design of the app's own mail in
`src/lib/email.server.ts`. Regenerate after design changes rather than editing by hand.

| Template | File | Subject |
| --- | --- | --- |
| confirm signup | `confirm-signup.html` | Confirm your LabelCheck account |
| reset password | `reset-password.html` | Reset your LabelCheck password |
| magic link | `magic-link.html` | Your LabelCheck sign-in link |
| change email | `change-email.html` | Confirm your new LabelCheck e-mail |

The **Site URL** in Authentication → URL configuration must be the public app URL
(https://sih.anshguptaa.in) so the logo and footer links resolve.
