// Shared LLM provider router for CopyMonster edge functions.
// Routes an OpenAI-compatible chat model id to Mistral, Ollama, or OpenRouter.
// All three providers speak OpenAI's /v1/chat/completions shape (incl. stream: true).

export type ProviderName = "mistral" | "ollama" | "openrouter";

export interface ResolvedProvider {
  provider: ProviderName;
  apiUrl: string;
  modelName: string;
  headers: Record<string, string>;
  supportsPenalties: boolean;
}

export interface ProviderError {
  error: string;
  status: number;
}

export function resolveProvider(
  modelId: string,
  opts: { referer?: string; title?: string } = {},
): ResolvedProvider | ProviderError {
  if (!modelId || typeof modelId !== "string") {
    return { error: "Missing model id", status: 400 };
  }

  // Mistral
  if (modelId.startsWith("mistralai/") || modelId.startsWith("mistral/")) {
    const apiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!apiKey) {
      return { error: "Mistral API not configured. Please contact support.", status: 500 };
    }
    return {
      provider: "mistral",
      apiUrl: "https://api.mistral.ai/v1/chat/completions",
      modelName: modelId.replace(/^mistralai\//, "").replace(/^mistral\//, ""),
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      supportsPenalties: false,
    };
  }

  // Ollama (self-hosted, BYO LLM)
  if (modelId.startsWith("ollama/")) {
    const baseUrl = Deno.env.get("OLLAMA_BASE_URL");
    if (!baseUrl) {
      return { error: "Ollama base URL not configured", status: 500 };
    }
    const trimmed = baseUrl.replace(/\/+$/, "");
    return {
      provider: "ollama",
      apiUrl: `${trimmed}/v1/chat/completions`,
      modelName: modelId.replace(/^ollama\//, ""),
      headers: {
        "Content-Type": "application/json",
      },
      supportsPenalties: false,
    };
  }

  // Default: OpenRouter
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return { error: "OpenRouter API not configured. Please contact support.", status: 500 };
  }
  return {
    provider: "openrouter",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelName: modelId,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": opts.referer ?? "https://copymonster.me",
      "X-Title": opts.title ?? "CopyMonster",
    },
    supportsPenalties: true,
  };
}

export function isProviderError(x: ResolvedProvider | ProviderError): x is ProviderError {
  return (x as ProviderError).error !== undefined;
}