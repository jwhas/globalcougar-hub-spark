type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type FetchLike = typeof fetch;

export type OpenRouterResult =
  | { ok: true; status: 200; reply: string }
  | { ok: false; status: number; error: string };

export function openRouterErrorMessage(status: number) {
  if (status === 429) return "The free assistant has reached its request limit or is busy right now. Your conversation is still here—please try again later.";
  if (status >= 400) return "The free assistant is temporarily unavailable. Please try again shortly.";
  return null;
}

export async function requestOpenRouter(
  options: { apiKey: string; model: string; messages: ChatMessage[]; temperature?: number },
  fetcher: FetchLike = fetch,
): Promise<OpenRouterResult> {
  let response: Response;
  try {
    response = await fetcher("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + options.apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://globalcougar-hub-spark.github.io",
        "X-Title": "GlobalCougar",
      },
      body: JSON.stringify({ model: options.model, messages: options.messages, temperature: options.temperature ?? 0.3 }),
    });
  } catch {
    return { ok: false, status: 503, error: "The assistant is temporarily unavailable. Please try again shortly." };
  }
  const upstreamError = openRouterErrorMessage(response.status);
  if (upstreamError) return { ok: false, status: response.status === 429 ? 429 : 503, error: upstreamError };
  let result: { choices?: Array<{ message?: { content?: unknown } }> };
  try {
    result = await response.json();
  } catch {
    return { ok: false, status: 502, error: "The assistant returned an invalid response. Please try again." };
  }
  const reply = result.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) return { ok: false, status: 502, error: "The assistant returned no answer. Please try again." };
  return { ok: true, status: 200, reply: reply.trim() };
}

