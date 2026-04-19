
The user wants to sync leads from CopyMonster (this project) → external Supabase project (alfedcsoicoheqargisr). Let me explore the current state first.

Key findings:
- No `leads` table exists in CopyMonster — leads are actually `profiles` (which contains email, first_name, phone, subscription_status, trial_expires_at)
- There's already a similar pattern: `notify_sender_on_profile_change()` trigger + `sender-sync` edge function. I'll mirror this for the new destination.
- Required fields map: nome=first_name, email=email, whatsapp=phone, lead_id=profiles.id (uuid, not number — need to flag this), status_lead=derived from subscription_status, nome_plano=subscription_status, data_inicio_trial=created_at, data_fim_trial=trial_expires_at.

Important mismatch: The user spec says `lead_id` should be `número (unique)`, but CopyMonster uses UUIDs. I'll use TEXT for lead_id to safely store UUIDs — this is the correct fix.

Plan is split into work done in CopyMonster (this repo) and SQL/code the user must run in the destination project.
