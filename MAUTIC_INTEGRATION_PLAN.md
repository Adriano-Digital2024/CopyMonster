# Mautic Integration Implementation Plan

## Objective

Replace the active **Sender** email-marketing integration with **Mautic**, keeping **Sender available as an independent open-source option**. The existing plan-mapping logic (`free`, `starter`, `pro`, `legend`) and server-side architecture must be preserved. No frontend routes, layouts, styles, or components will be created or modified.

---

## Current State Analysis

- `supabase/functions/sender-sync/index.ts` exists and syncs user data to Sender.net.
- `supabase/config.toml` registers `sender-sync` with `verify_jwt = false`.
- `.env.example` documents `SENDER_API_KEY`.
- The frontend has **no direct references** to Sender; the integration is purely server-side.
- Database triggers already invoke `sender-sync` via the function `notify_sender_on_profile_change()`:
  - `trg_mautic_sync_insert` on `AFTER INSERT ON public.profiles`.
  - `trg_mautic_sync_update` on `AFTER UPDATE OF subscription_status ON public.profiles`.
- **No Mautic code, edge function, migrations, or environment variables exist in the repository yet.**
- Mautic instance: `https://mautic.integridadedigital.com.br/`.
- Mautic OAuth2 credentials (`MAUTIC_CLIENT_ID`, `MAUTIC_CLIENT_SECRET`) are already stored in Supabase Edge Function Secrets.
- Mautic redirect URI is configured as `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-callback`.
- Mautic custom contact field for plan has alias `plan`, type "Text: Short Answer", default value `Free`, accepted values: `Free`, `Starter`, `Pro`, `Legend`.

---

## Implementation Strategy

1. Create a new edge function `mautic-callback` to complete the OAuth2 Authorization Code flow and store tokens.
2. Create a new edge function `mautic-sync` that mirrors the input interface of `sender-sync` (`type`, `record`).
3. Map `subscription_status` to plan text values (`Free`, `Starter`, `Pro`, `Legend`).
4. Reuse the existing `user_integrations` table to store Mautic OAuth2 tokens with `provider = 'mautic'`.
5. Implement token refresh inside `mautic-sync` when the access token is expired.
6. Create or update Mautic contacts via the Mautic REST API using the stored access token.
7. Leave `sender-sync` completely untouched so it remains a standalone open-source option.
8. Create new, independent database triggers that invoke `mautic-sync` on user creation and plan updates.
9. Register both new edge functions in `supabase/config.toml`.
10. Document Mautic placeholders in `.env.example` and ensure `.env` is ignored.
11. Test locally, then deploy to production.

---

## OAuth2 Flow

1. Admin opens the Mautic authorization URL:
   ```
   https://mautic.integridadedigital.com.br/oauth/v2/authorize?client_id=<MAUTIC_CLIENT_ID>&response_type=code&redirect_uri=https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-callback
   ```
2. Admin logs in and authorizes the integration.
3. Mautic redirects to `mautic-callback` with an authorization `code`.
4. `mautic-callback` exchanges the `code` for `access_token` and `refresh_token` via `POST /oauth/v2/token`.
5. Tokens are stored in `user_integrations` with `provider = 'mautic'`.
6. `mautic-sync` reads tokens, refreshes if expired, and calls Mautic contact APIs.

---

## Files Expected to Change

1. `MAUTIC_INTEGRATION_PLAN.md` — updated final plan.
2. `supabase/functions/mautic-callback/index.ts` — new file.
3. `supabase/functions/mautic-sync/index.ts` — new file.
4. `supabase/config.toml` — add `mautic-callback` and `mautic-sync` sections.
5. `.env.example` — add Mautic placeholders.
6. `.gitignore` — ensure `.env` is ignored.
7. `supabase/migrations/YYYYMMDDHHMMSS_mautic_integration.sql` — create independent Mautic triggers.

---

## Implementation Checklist

### Phase 1 — OAuth2 Callback Edge Function

- **Step 1** — Create `supabase/functions/mautic-callback/index.ts`.
- **Step 2** — Read `MAUTIC_BASE_URL`, `MAUTIC_CLIENT_ID`, and `MAUTIC_CLIENT_SECRET` from environment.
- **Step 3** — Handle CORS preflight requests.
- **Step 4** — Extract `code` from the request URL query string.
- **Step 5** — Exchange the `code` for tokens via `POST /oauth/v2/token` with `grant_type=authorization_code`.
- **Step 6** — Create a service-role Supabase client to store tokens in `user_integrations` with `provider = 'mautic'`.
- **Step 7** — Store `access_token`, `refresh_token`, `expires_at`, and `status = 'connected'`.
- **Step 8** — Return a clear HTML response indicating success or failure.

### Phase 2 — Mautic Sync Edge Function

- **Step 9** — Create `supabase/functions/mautic-sync/index.ts`.
- **Step 10** — Implement input interface `{ type: "new_user" | "plan_update", record: { email, first_name, phone, subscription_status } }`.
- **Step 11** — Map `subscription_status` to plan text values:
  - `free` → `Free`
  - `starter` → `Starter`
  - `pro` → `Pro`
  - `legend` → `Legend`
- **Step 12** — Query `user_integrations` to retrieve the stored Mautic tokens.
- **Step 13** — If the access token is expired, refresh it using `POST /oauth/v2/token` with `grant_type=refresh_token` and update the database.
- **Step 14** — For `new_user` events: create contact via `POST /api/contacts/new`.
- **Step 15** — For `plan_update` events: search contact by email (`GET /api/contacts?search=email:...`), then update via `PATCH /api/contacts/{id}/edit`.
- **Step 16** — Send payload with `firstname`, `email`, `phone`, and `plan`.
- **Step 17** — Implement CORS headers, error handling, and logging.

### Phase 3 — Keep Sender Independent

- **Step 18** — Do not modify `supabase/functions/sender-sync/index.ts`.
- **Step 19** — Do not modify existing `notify_sender_on_profile_change()` function or its triggers.
- **Step 20** — Ensure `sender-sync` remains fully operational for open-source users.

### Phase 4 — Independent Database Triggers for Mautic

- **Step 21** — Create a new function `notify_mautic_on_profile_change()`.
- **Step 22** — Build the same payload shape used by `sender-sync`.
- **Step 23** — Call `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-sync` via `net.http_post`.
- **Step 24** — Create new trigger `trg_mautic_sync_insert` on `AFTER INSERT ON public.profiles`.
- **Step 25** — Create new trigger `trg_mautic_sync_update` on `AFTER UPDATE OF subscription_status ON public.profiles`.

### Phase 5 — Configuration Files

- **Step 26** — Add to `supabase/config.toml`:
  ```toml
  [functions.mautic-callback]
  verify_jwt = false

  [functions.mautic-sync]
  verify_jwt = false
  ```
- **Step 27** — Update `.env.example` with placeholders only:
  ```env
  # Mautic OAuth2 (server-side, set in Supabase Edge Function Secrets)
  # MAUTIC_BASE_URL=https://mautic.integridadedigital.com.br
  # MAUTIC_CLIENT_ID=
  # MAUTIC_CLIENT_SECRET=
  ```
- **Step 28** — Add `.env` to `.gitignore` if not already present.

### Phase 6 — Testing

- **Step 29** — Run `supabase functions serve` locally.
- **Step 30** — Deploy `mautic-callback` to production first.
- **Step 31** — Perform the one-time OAuth2 authorization to generate and store tokens.
- **Step 32** — Test `mautic-sync` with a `new_user` payload and verify contact creation in Mautic.
- **Step 33** — Test `mautic-sync` with a `plan_update` payload and verify the `plan` field updates.
- **Step 34** — Test token refresh by simulating an expired access token.
- **Step 35** — Confirm `sender-sync` still works independently.
- **Step 36** — Run frontend build and linter to confirm zero impact.

### Phase 7 — Production Deployment

- **Step 37** — Add `MAUTIC_BASE_URL`, `MAUTIC_CLIENT_ID`, and `MAUTIC_CLIENT_SECRET` to Supabase Edge Function Secrets.
- **Step 38** — Deploy `mautic-callback` and `mautic-sync`.
- **Step 39** — Run the migration to create the independent Mautic triggers.
- **Step 40** — Perform the one-time admin authorization in production.
- **Step 41** — Smoke test by creating/updating a user profile.

---

## Constraints Respected

- No new frontend routes will be created.
- No frontend layouts, styles, colors, or imports will be changed.
- No new UI components will be created.
- Only existing server-side patterns (edge functions, config files, migrations) will be used.
- The existing `sender-sync` edge function and triggers will remain untouched.
- All changes will follow the established TypeScript, Supabase, and logging conventions found in the project.
