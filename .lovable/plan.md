## Goal

Turn the existing hard-coded provider fork in `chat-stream` and `agent-test` into a proper multi-provider router that supports OpenRouter, Mistral (already partly wired) and Ollama (self-hosted, BYO LLM). This unlocks the Open-Core promise of "bring your own LLM" for self-hosters without breaking the SaaS defaults.

Nothing else changes: credits, DNA guard, rate limits, streaming shape, agent admin UI, model catalog, and i18n stay identical.

## Current state

- `chat-stream/index.ts` and `agent-test/index.ts` each have an inline `isMistral = model.startsWith('mistralai/'|'mistral/')` branch and otherwise fall through to OpenRouter. No Ollama support. Duplicated logic in both files.
- Env already has `OPENROUTER_API_KEY` and `MISTRAL_API_KEY`. `OLLAMA_BASE_URL` is documented in `.env.example` but not read anywhere.
- Model IDs come from the `agents.model_id` column (admin picks them in the Models page) and are OpenAI-chat-compatible strings.

## Design

### 1. Shared provider router

Create `supabase/functions/_shared/llm-router.ts` with a single pure function:

```ts
resolveProvider(modelId: string): {
  provider: "mistral" | "ollama" | "openrouter";
  apiUrl: string;
  modelName: string;
  headers: Record<string,string>;
  supportsPenalties: boolean;
} | { error: string; status: number }
```

Routing rules (prefix-based, deterministic, no behavior change for existing IDs):

| Prefix on `model_id` | Provider | Endpoint | Key env |
|---|---|---|---|
| `mistralai/` or `mistral/` | Mistral | `https://api.mistral.ai/v1/chat/completions` | `MISTRAL_API_KEY` |
| `ollama/` | Ollama | `${OLLAMA_BASE_URL}/v1/chat/completions` | none (self-hosted) |
| anything else (default) | OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `OPENROUTER_API_KEY` |

Ollama exposes an OpenAI-compatible `/v1/chat/completions` endpoint that already supports `stream: true`, so no client changes are needed — we just strip the `ollama/` prefix from `modelName` (e.g. `ollama/llama3.1:8b` → `llama3.1:8b`). If `OLLAMA_BASE_URL` is missing when an `ollama/` model is selected, return a clean 500 with `error: "Ollama base URL not configured"` instead of crashing.

`supportsPenalties` stays true only for OpenRouter (same rule already in `agent-test`), so Mistral/Ollama calls skip `frequency_penalty` / `presence_penalty`.

### 2. Refactor `chat-stream/index.ts`

- Replace the `if (isMistral) … else …` block (lines ~510–548) with `const route = resolveProvider(selectedModel)`.
- Bail out early with the current 500 shape if `route.error` is set (missing key or missing Ollama URL) and refund the credit exactly like the existing API-error branch already does.
- Use `route.apiUrl`, `route.headers`, `route.modelName` in the existing `fetch`. Streaming response path is unchanged — Mistral, OpenRouter, and Ollama all speak OpenAI SSE.
- Keep the existing `X-Credits-Remaining` header, DNA guard, rate limit, and auto-start logic untouched.

### 3. Refactor `agent-test/index.ts`

- Same swap: replace the inline `isMistral` block with `resolveProvider(model_id)`.
- Keep admin-only guard, streaming passthrough, and the `supportsPenalties` gate for `frequency_penalty` / `presence_penalty`.

### 4. Env & docs

- Add `OLLAMA_BASE_URL` to the list of edge function secrets the code reads. It stays optional; SaaS deployments simply never set it and never expose an `ollama/` model. Self-hosters set it (typical value `http://host.docker.internal:11434` from a Supabase edge runtime container, or the public URL of their Ollama server).
- `.env.example` already lists `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`, `OLLAMA_BASE_URL` — no change needed.
- Append a short "Bring your own LLM" section to `README.md` (English) documenting the three provider prefixes and how to register an Ollama model in `admin/Models` (just enter e.g. `ollama/llama3.1:8b` as the model id).

### 5. Not in scope (explicitly)

- No change to the `models` DB table, the admin Models page, the agent config UI, or the frontend chat.
- No new provider beyond the three above (no direct OpenAI, no direct Anthropic — OpenRouter already fronts them).
- No token-usage accounting change; `usage_logs` still logs `model_used = modelName`.
- No Lovable AI Gateway migration on these two functions (that would be a separate roadmap item).

## Validation

1. Deploy `chat-stream` and `agent-test`.
2. In admin Models, keep an existing OpenRouter model (e.g. `google/gemini-2.5-flash`) → send a chat message → confirm stream + credit debit are unchanged (regression check).
3. Keep an existing Mistral model (e.g. `mistralai/mistral-large-latest`) → confirm streaming still works.
4. (Optional, self-host only) Add a model row with id `ollama/llama3.1:8b`, set `OLLAMA_BASE_URL`, and confirm the same chat flow streams tokens from the local Ollama server.
5. Check edge function logs for the new `[chat-stream] Using model: X via ollama|mistral|openrouter` line.

## Files touched

- **New:** `supabase/functions/_shared/llm-router.ts`
- **Edit:** `supabase/functions/chat-stream/index.ts` (provider selection block only)
- **Edit:** `supabase/functions/agent-test/index.ts` (provider selection block only)
- **Edit:** `README.md` (add "Bring your own LLM" subsection)
