interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  models?: string[];
  maxRetries?: number;
}

// Priority list — try these in order until one works
const FREE_MODEL_FALLBACKS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
];

function getModelList(): string[] {
  // If user provided a specific model, use it first, then fall back to the list
  const primary = process.env.OPENROUTER_MODEL;
  if (primary && !FREE_MODEL_FALLBACKS.includes(primary)) {
    return [primary, ...FREE_MODEL_FALLBACKS];
  }
  if (primary) {
    return [primary, ...FREE_MODEL_FALLBACKS.filter((m) => m !== primary)];
  }
  return FREE_MODEL_FALLBACKS;
}

export async function chat({
  messages,
  temperature = 0.2,
  models,
  maxRetries = 2,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log(
  "[AI] Env check — OPENROUTER_API_KEY:",
  apiKey ? `present (${apiKey.slice(0, 12)}...)` : "MISSING"
);

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const modelList = models || getModelList();

  let lastError: Error | null = null;

  // Try each model in order
  for (const model of modelList) {
    console.log(`[AI] Trying model: ${model}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://sheetforge.app",
              "X-Title": "SheetForge",
            },
                        body: JSON.stringify({
              model,
              messages,
              temperature,
              // Force the model to return only valid JSON — no reasoning text
              response_format: { type: "json_object" },
              provider: {
                sort: "throughput",
                allow_fallbacks: true,
                // Only route to providers that support the json_object parameter
                require_parameters: true,
              },
            }),
          }
        );

        // 5xx or 429 → retry this model
        if (res.status >= 500 || res.status === 429) {
          const text = await res.text();
          lastError = new Error(`OpenRouter ${res.status}: ${text}`);
          console.warn(
            `[AI] ${model} attempt ${attempt}/${maxRetries} → ${res.status}`
          );
          if (attempt < maxRetries) {
            await new Promise((r) =>
              setTimeout(r, 1000 * Math.pow(2, attempt - 1))
            );
            continue;
          }
          // Move to next model
          break;
        }

        if (!res.ok) {
          const text = await res.text();
          lastError = new Error(`OpenRouter error ${res.status}: ${text}`);
          // 401/402/404 — no point retrying, skip to next model
          break;
        }

        const data = await res.json();
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.message?.reasoning_content ||
          "";

        if (!content) {
          lastError = new Error("Empty response from model");
          break;
        }

        console.log(`[AI] ✓ Success with ${model}`);
        return content;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI] ${model} threw: ${error.message}`);
        if (attempt < maxRetries) {
          await new Promise((r) =>
            setTimeout(r, 1000 * Math.pow(2, attempt - 1))
          );
          continue;
        }
        break;
      }
    }
    // Fall through to the next model in the list
  }

  throw new Error(
    lastError?.message ||
      "All models failed. Try again in a minute or add a paid model to OpenRouter."
  );
}