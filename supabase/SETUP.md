# Supabase Setup

## Create the project

1. Create a free Supabase account at https://supabase.com, choose **New project**, select an organization, enter a project name and a strong database password, then choose a nearby region. Keep the database password private.
2. In the Supabase SQL Editor, run `schema.sql` from this folder.
3. In Authentication settings, enable email/password sign-in and configure the site URL and redirect URLs for local development and the deployed site.
4. In `js/config.js`, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` using the project's URL and publishable/anon key. These browser values are public; never put a `service_role` key in this website.
5. Deploy the static site to a host such as Cloudflare Pages or Netlify. It needs to be served over HTTPS and must support the configured auth redirect URL.

## Create the first admin

1. Register the owner account through the site's Account page and confirm the email if confirmation is enabled.
2. In Supabase SQL Editor, find that account's UUID with:

   ```sql
   select id, email from auth.users where email = 'owner@example.com';
   ```

3. Add only the intended owner account to the admin allowlist, replacing the UUID:

   ```sql
   insert into public.admin_users (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

The website does not expose a way for users to grant themselves admin access. Keep the Supabase project owner account and database credentials private.

## Ticket approval behavior

Users must sign in before submitting a request. Requests are pending and contain no card details. After verifying any payment outside this demo, an admin can approve a request. The database function checks admin membership, locks the pending request, changes its status, and creates the requested ticket rows in one transaction. Repeated approval is rejected. Issued tickets are visible only to the ticket owner or an admin.

Ticket numbers are globally unique numeric serials shown as `YP-000001`. Existing installations should rerun the updated `schema.sql` in the Supabase SQL Editor to add the sequence and migrate existing tickets.

## Email notifications

The site sends a request-received email after checkout and an issued-ticket email after an admin approves the request. The approval email includes a simple digital ticket for each ticket, with its unique number, event date, and venue. Email is sent by a Supabase Edge Function; provider credentials are never placed in browser code.

1. Verify a sender domain in Resend and create an API key.
2. Install the Supabase CLI and link it to this project with `supabase login` and `supabase link --project-ref YOUR_PROJECT_REF`.
3. Configure the function secrets, replacing the sender with an address on your verified domain:

   ```sh
   supabase secrets set RESEND_API_KEY=re_... TICKET_EMAIL_FROM="Youthful Praise <tickets@example.com>" TICKET_ADMIN_EMAIL=owner@example.com
   ```

4. Deploy the function:

   ```sh
   supabase functions deploy ticket-notifications
   ```

The function validates the signed-in user and checks request ownership for purchase emails or admin membership for issued-ticket emails. Configure `RESEND_API_KEY` and `TICKET_EMAIL_FROM` as Supabase secrets only. Email delivery failure does not undo a saved request or an approved ticket issuance.

An admin must still verify payment through the agreed payment channel before approving a request. The site does not process payments; add a payment provider and server-side webhook before automating payment verification.