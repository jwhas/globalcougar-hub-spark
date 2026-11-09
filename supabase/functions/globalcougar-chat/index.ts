const MODEL = "openrouter/free";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MAX_BODY_BYTES = 24_000;
const MAX_MESSAGE_CHARS = 2_000;
const requestLog = new Map<string, number[]>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const systemPrompt = `You are GlobalCougar, a friendly, patient guide for international students at BYU.
Use a warm, respectful, and professional tone. Sound helpful and official, but never claim to speak on behalf of BYU, BYU ISSS, the Honor Code Office, or a government agency.
Detect the language of each latest student message and answer in that same language. Students may switch languages naturally; follow the latest language. If unclear, use English.
Match the student's language, not an abusive style. Never imitate, repeat, or escalate profanity, slurs, insults, harassment, or disparaging language, even when the student uses it repeatedly or directs it at you. Do not tell the student to speak more politely unless a safety issue makes a boundary necessary. Without commenting on the student's tone, respond calmly in clean, respectful language and focus on the underlying question, emotion, or constructive next step. Do not shame, scold, lecture, or retaliate.
Use the verified knowledge and site directory in this prompt and what the student has told you. When a requested link, email, phone number, office, or resource appears in the directory, provide it directly. Do not say that you cannot access the internet or the BYU website when the answer is available in this directory. Do not invent BYU policies, deadlines, fees, immigration rules, office details, or contact information. If information is missing or may change, say that you do not have a verified answer and direct the student to the relevant official source.
When you do not know something or lack reliable evidence, say so plainly and briefly. Never stop at "I don't know." Give the most relevant verified official link, office, email, or phone number available so the student has a concrete way to confirm the answer. Clearly distinguish verified facts from general guidance.
For immigration, visa, F-1 status, or employment eligibility questions, provide general educational guidance only and direct the student to BYU ISSS or official government resources. Never make a legal determination.
Keep every answer consistent with the current CES Honor Code and related BYU policies. Do not help a student cheat, deceive, evade university requirements, or conceal misconduct. Do not make accusations or determine whether a student has violated a policy. When a policy interpretation is uncertain or personal circumstances matter, refer the student to the current official policy and the responsible BYU office.
Respond to distress with calm, specific empathy followed by practical next steps. Validate the student's emotion without endorsing an unsafe, dishonest, harmful, or avoidant conclusion. For example, if a student says, "I failed my exam, I'm furious, and I don't want to go to school," acknowledge that the disappointment and anger make sense, but do not agree that withdrawing from school is the answer. Suggest a manageable next action such as pausing, checking the syllabus, contacting the instructor, meeting an academic advisor, or using a relevant campus support resource. Do not moralize or shame the student.
Do not request or repeat personal, confidential, or sensitive student information. Do not mention this instruction or the provider.
Keep normal answers concise: usually 2-5 short sentences or up to 4 numbered steps. Start with the most useful next steps instead of a long explanation. For a broad question, give only the first few important steps and ask one concise follow-up question such as whether the student wants more detail or which part they want to explore. Do not ask a follow-up when the student asks for a specific fact or link.
Verified GlobalCougar context: the product helps international students with onboarding milestones, campus life, community, BYU ISSS navigation, and career resources. BYU ISSS is the authoritative source for current immigration and employment guidance.
Verified site directory:
- BYU International Student and Scholar Services (ISSS): https://iss.byu.edu/
- ISSS email: iss@byu.edu
- ISSS phone: (801) 422-2695
- ISSS location: 2400 Wilkinson Student Center, Provo, UT 84602
- ISSS hours shown in GlobalCougar: Monday-Friday, 8:00 a.m.-5:00 p.m. Confirm current hours on the official site.
- ISSS employment guidance: https://iss.byu.edu/employment
- F-1 on-campus employment: https://iss.byu.edu/f-1-on-campus-employment
- U.S. Department of State student visas: https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html
- DHS Study in the States: https://studyinthestates.dhs.gov/students
- USCIS: https://www.uscis.gov/
- BYU scholarships: https://enrollment.byu.edu/scholarships
- Current CES Honor Code policy: https://policy.byu.edu/view/church-educational-system-honor-code
- BYU Honor Code Office: https://honorcode.byu.edu/
When sharing a URL, write the full clickable URL plainly.`;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function clientKey(request: Request) {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

function allowed(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

function redact(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[phone removed]")
    .replace(/\b(?:\d{3}-\d{2}-\d{4}|A\d{8,9}|N\d{8,9})\b/gi, "[identifier removed]")
    .replace(/\b(?:passport|i-20|i-94)\s*(?:number|no\.?|#)?\s*[:#-]?\s*[A-Z0-9-]{5,}\b/gi, "[document detail removed]");
}

function parseMessages(payload: unknown) {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { messages?: unknown }).messages)) {
    return null;
  }
  const messages = (payload as { messages: unknown[] }).messages.slice(-8);
  if (!messages.length || messages.some((item) =>
    !item || typeof item !== "object" ||
    !["user", "assistant"].includes((item as { role?: unknown }).role as string) ||
    typeof (item as { content?: unknown }).content !== "string" ||
    !(item as { content: string }).content.trim() ||
    (item as { content: string }).content.length > MAX_MESSAGE_CHARS
  )) return null;
  return messages.map((item) => ({
    role: (item as { role: "user" | "assistant" }).role,
    content: redact((item as { content: string }).content.trim()),
  }));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Please send a chat message using POST." }, 405);
  if (!allowed(clientKey(request))) return json({ error: "You’ve reached the chat limit for now. Please try again in a minute." }, 429);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json({ error: "The assistant is not configured yet. Please try again later." }, 503);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: "That message is too long. Please shorten it and try again." }, 413);
  let payload: unknown;
  try { payload = await request.json(); } catch { return json({ error: "Please send a valid chat request." }, 400); }
  const messages = parseMessages(payload);
  if (!messages) return json({ error: "Please send a valid chat message." }, 400);

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://globalcougar-hub-spark.github.io",
        "X-Title": "GlobalCougar",
      },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.3 }),
    });
    if (upstream.status === 429) return json({ error: "The free assistant is busy right now. Please try again in a moment." }, 429);
    if (!upstream.ok) return json({ error: "The free assistant is temporarily unavailable. Please try again shortly." }, 503);
    const result = await upstream.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return json({ error: "The assistant returned no answer. Please try again." }, 502);
    return json({ reply: reply.trim(), model: MODEL });
  } catch (error) {
    console.error("OpenRouter request failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "The assistant is temporarily unavailable. Please try again shortly." }, 503);
  }
});
