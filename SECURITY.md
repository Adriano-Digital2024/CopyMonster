# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CopyMonster, please **do not**
open a public GitHub issue. Instead, report it privately:

- **Email:** security@copymonster.me
- **Response time:** within 72 hours
- **Disclosure:** coordinated, after a fix is released

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept if possible)
- Affected version / commit SHA
- Your contact for follow-up

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |
| Tagged releases (latest minor) | Yes |
| Older releases | No |

## Scope

In scope:

- The open-source Core (this repository)
- Edge Functions shipped under `supabase/functions/`
- Default RLS policies in `supabase/migrations/`

Out of scope:

- Third-party providers (Supabase, Meta, Stripe, OpenAI, Anthropic, OpenRouter, Mistral, Ollama)
- The hosted Cloud edition (report to security@copymonster.me with `[cloud]` prefix)
- Enterprise modules (private — report to enterprise@copymonster.me)

Thank you for helping keep CopyMonster and its users safe.