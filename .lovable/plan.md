

## Sender.net Integration Plan

### Analysis

The current system has two key moments where Sender.net needs to be notified:
1. **New user signup** — handled by `handle_new_user()` DB function (inserts into `profiles`)
2. **Plan change** — handled by `stripe-webhook` edge function (updates `subscription_status` in `profiles`)

To avoid modifying any existing working code, the approach uses a **database trigger + `pg_net`** to automatically call a new edge function whenever the `profiles` table is modified.

### Architecture

```text
User signs up → handle_new_user() → INSERT profiles
                                         ↓
                              DB trigger (pg_net)
                                         ↓
                            sender-sync Edge Function
                                         ↓
                              Sender.net API (POST)

Plan changes → stripe-webhook → UPDATE profiles.subscription_status
                                         ↓
                              DB trigger (pg_net)
                                         ↓
                            sender-sync Edge Function
                                         ↓
                              Sender.net API (PUT)
```

### Changes

**1. Add secret: `SENDER_API_KEY`**
- Request the user's Sender.net API key

**2. New edge function: `supabase/functions/sender-sync/index.ts`**
- Accepts `{ type: "new_user" | "plan_update", record: {...} }`
- On `new_user`: POST to `https://api.sender.net/v2/subscribers` with email, firstname, phone, plan=free, groups=["bqp09r"]
- On `plan_update`: POST to same endpoint (Sender upserts by email) with updated plan field
- Error handling, logging, idempotent (Sender upserts subscribers by email)

**3. Database migration: trigger + pg_net function**
- Enable `pg_net` extension (if not already)
- Create function `notify_sender_on_profile_change()` that uses `net.http_post()` to call the `sender-sync` edge function
- Create trigger `on_profile_insert` (AFTER INSERT on profiles) — sends `new_user`
- Create trigger `on_profile_plan_update` (AFTER UPDATE on profiles WHEN OLD.subscription_status != NEW.subscription_status) — sends `plan_update`

**4. Update `supabase/config.toml`** — add `sender-sync` function config

### No existing code is modified
- `handle_new_user()` remains unchanged
- `stripe-webhook` remains unchanged
- All frontend code remains unchanged
- The trigger fires automatically on the `profiles` table events

### Secret needed
- `SENDER_API_KEY` — the user's Sender.net API Bearer token

