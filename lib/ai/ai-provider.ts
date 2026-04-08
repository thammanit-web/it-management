/**
 * AI Provider with automatic fallback chain:
 * Priority: 1. Ollama (local) → 2. Groq → 3. OpenRouter
 * If a provider is offline, it automatically falls back to the next.
 * Once Ollama recovers, it switches back automatically on next request.
 */

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIResponse = {
  content: string;
  provider: "ollama" | "groq" | "openrouter";
  model: string;
};

type ProviderConfig = {
  name: "ollama" | "groq" | "openrouter";
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers: Record<string, string>;
};

function getProviders(): ProviderConfig[] {
  return [
    {
      name: "ollama",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2:3b",
      headers: { "Content-Type": "application/json" },
    },
    {
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    },
    {
      name: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3003",
        "X-Title": "NDC IT System",
      },
    },
  ];
}

async function callOllama(provider: ProviderConfig, messages: AIMessage[]): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/api/chat`, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false,
      options: { temperature: 0.3, num_predict: 1024 },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.message?.content || "";
}

async function callOpenAICompatible(provider: ProviderConfig, messages: AIMessage[]): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${provider.name} error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Main AI chat function with automatic provider fallback.
 * Tries Ollama first (fastest, local), then Groq, then OpenRouter.
 */
export async function aiChat(messages: AIMessage[]): Promise<AIResponse> {
  const providers = getProviders();
  const errors: string[] = [];

  for (const provider of providers) {
    // Skip if no API key configured (for cloud providers)
    if (provider.name !== "ollama" && !provider.apiKey) {
      errors.push(`${provider.name}: No API key configured`);
      continue;
    }

    try {
      let content: string;
      if (provider.name === "ollama") {
        content = await callOllama(provider, messages);
      } else {
        content = await callOpenAICompatible(provider, messages);
      }

      if (content) {
        return { content, provider: provider.name, model: provider.model };
      }
      throw new Error("Empty response");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.name}: ${msg}`);
      console.warn(`[AI] ${provider.name} failed, trying next...`, msg);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}

/**
 * Quick health check for all providers (non-blocking, returns status map)
 */
export async function checkProvidersHealth(): Promise<Record<string, boolean>> {
  const providers = getProviders();
  const results: Record<string, boolean> = {};

  await Promise.allSettled(
    providers.map(async (p) => {
      try {
        if (p.name === "ollama") {
          const res = await fetch(`${p.baseUrl}/api/tags`, {
            signal: AbortSignal.timeout(3000),
          });
          results[p.name] = res.ok;
        } else if (p.apiKey) {
          const res = await fetch(`${p.baseUrl}/models`, {
            headers: p.headers,
            signal: AbortSignal.timeout(5000),
          });
          results[p.name] = res.ok;
        } else {
          results[p.name] = false;
        }
      } catch {
        results[p.name] = false;
      }
    })
  );

  return results;
}
