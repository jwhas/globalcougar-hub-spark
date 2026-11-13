import { createFileRoute } from "@tanstack/react-router";
import { BYU_NEWS_RSS_URL, parseByuNewsRss } from "@/lib/announcements/news-rss";

const MAX_FEED_BYTES = 2_000_000;
const FEED_TIMEOUT_MS = 15_000;

function fail(error: string, status: number) {
  return Response.json(
    { ok: false, error },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("The BYU News feed exceeded the size limit.");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("The BYU News feed returned no response body.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("The BYU News feed exceeded the size limit.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export const Route = createFileRoute("/api/admin/announcements/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (
          process.env["NODE_ENV"] === "production" ||
          process.env["ANNOUNCEMENTS_IMPORT_ENABLED"] !== "true"
        ) {
          return fail("Manual announcement imports are disabled.", 404);
        }
        if (!sameOrigin(request)) return fail("Request origin is not allowed.", 403);

        const expectedSecret = process.env["ANNOUNCEMENTS_SYNC_SECRET"];
        const authorization = request.headers.get("authorization");
        if (!expectedSecret || expectedSecret.length < 32) {
          return fail("The local announcement sync secret is not configured.", 503);
        }
        if (authorization !== `Bearer ${expectedSecret}`) {
          return fail("Unauthorized.", 401);
        }

        try {
          const response = await fetch(BYU_NEWS_RSS_URL, {
            headers: { Accept: "application/rss+xml, application/xml, text/xml" },
            redirect: "error",
            signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
          });
          if (!response.ok) throw new Error(`BYU News returned HTTP ${response.status}.`);
          const xml = await readLimitedText(response, MAX_FEED_BYTES);
          const rows = parseByuNewsRss(xml);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("announcements")
            .upsert(rows, { onConflict: "source,source_item_id" })
            .select("id");

          if (error) throw new Error(`Supabase import failed: ${error.message}`);
          return Response.json(
            { ok: true, imported: rows.length, stored: data?.length ?? 0 },
            {
              headers: { "Cache-Control": "no-store" },
            },
          );
        } catch (error) {
          console.error("[Announcements] Manual BYU News import failed:", error);
          return fail(error instanceof Error ? error.message : "The BYU News import failed.", 502);
        }
      },
    },
  },
});
