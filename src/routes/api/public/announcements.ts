import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function fail(error: string, status: number) {
  return Response.json(
    { ok: false, error },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export const Route = createFileRoute("/api/public/announcements")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return fail("The announcements database is not configured.", 503);

        const supabase = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(
                typeof Request !== "undefined" && input instanceof Request
                  ? input.headers
                  : undefined,
              );
              if (init?.headers)
                new Headers(init.headers).forEach((value, name) => headers.set(name, value));
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("announcements")
          .select(
            "id,source,source_url,title,summary,categories,interest_keys,published_at,starts_at,ends_at,expires_at",
          )
          .eq("is_published", true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(100);

        if (error) {
          console.error("[Announcements] Public query failed:", error.message);
          return fail("Live announcements are temporarily unavailable.", 503);
        }

        return Response.json(
          { ok: true, announcements: data ?? [] },
          {
            headers: { "Cache-Control": "no-store" },
          },
        );
      },
    },
  },
});
