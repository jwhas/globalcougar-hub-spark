export type TaskSuggestion = {
  title: string;
  description: string;
  steps: string[];
};

export const TASK_BLOCK_START = "<<<GLOBALCOUGAR_TASK>>>";
export const TASK_BLOCK_END = "<<<END_GLOBALCOUGAR_TASK>>>";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validateTaskSuggestion(value: unknown): TaskSuggestion | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { title?: unknown; description?: unknown; steps?: unknown };
  const title = cleanText(candidate.title, 160);
  const description = cleanText(candidate.description, 1000);
  const steps = Array.isArray(candidate.steps)
    ? candidate.steps.map((step) => cleanText(step, 300)).filter(Boolean).slice(0, 20)
    : [];
  if (!title || !steps.length) return null;
  return { title, description, steps };
}

export function parseTaskSuggestion(modelReply: string) {
  const start = modelReply.lastIndexOf(TASK_BLOCK_START);
  if (start < 0) return { reply: modelReply.trim(), taskSuggestion: null };
  const end = modelReply.indexOf(TASK_BLOCK_END, start + TASK_BLOCK_START.length);
  const visibleReply = (end < 0
    ? modelReply.slice(0, start)
    : modelReply.slice(0, start) + modelReply.slice(end + TASK_BLOCK_END.length)
  ).trim();
  if (end < 0) return { reply: visibleReply, taskSuggestion: null };
  try {
    const raw = modelReply.slice(start + TASK_BLOCK_START.length, end).trim();
    return { reply: visibleReply, taskSuggestion: validateTaskSuggestion(JSON.parse(raw)) };
  } catch {
    return { reply: visibleReply, taskSuggestion: null };
  }
}
