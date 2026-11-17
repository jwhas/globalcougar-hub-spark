import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const dateValue = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  })
  .nullable();

// Allowlist editable public.student fields; identity and creation IDs stay database-managed.
const userSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().max(254).email().or(z.literal("")),
    home_country: z.string().trim().max(100),
    semester: z.string().trim().max(80),
    situations: z.string().trim().max(2000),
    account_start_date: dateValue,
    us_arrival_date: dateValue,
  })
  .strict();

type UserInput = z.infer<typeof userSchema>;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (error: string, status: number) => json({ ok: false, error }, status);

function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

function authenticatedClient(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
    return fail("Sign in to manage users.", 401);
  }

  const token = authorization.slice(7).trim();
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key) {
    console.error(
      "User management requires Supabase URL and publishable-key environment variables.",
    );
    return fail("User management is not configured.", 503);
  }

  const db = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        }
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });

  // Forward the signed-in user's token so Supabase RLS, not a service-role key, authorizes CRUD.
  return { db };
}

async function readUserInput(request: Request): Promise<UserInput | Response> {
  if (Number(request.headers.get("content-length") ?? 0) > 12_000) {
    return fail("User details are too large.", 413);
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 12_000) return fail("User details are too large.", 413);
    payload = JSON.parse(raw);
  } catch {
    return fail("User details must be valid JSON.", 400);
  }

  const result = userSchema.safeParse(payload);
  return result.success ? result.data : fail("User details are invalid.", 400);
}

function userId(request: Request): number | null {
  const id = Number(new URL(request.url).searchParams.get("id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const Route = createFileRoute("/api/public/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authenticatedClient(request);
        if (auth instanceof Response) return auth;

        try {
          const { data, error } = await auth.db
            .from("student")
            .select("*")
            .order("id", { ascending: true });
          if (error) {
            console.error("Could not load student records:", error.message);
            return fail(`Users could not be loaded: ${error.message}`, 502);
          }
          return json({ ok: true, users: data ?? [] });
        } catch (error) {
          console.error(
            "Could not load student records:",
            error instanceof Error ? error.message : error,
          );
          return fail(
            `Users could not be loaded: ${error instanceof Error ? error.message : "database request failed."}`,
            502,
          );
        }
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const auth = await authenticatedClient(request);
        if (auth instanceof Response) return auth;
        const input = await readUserInput(request);
        if (input instanceof Response) return input;

        try {
          const { data, error } = await auth.db.from("student").insert(input).select("*").single();
          if (error) {
            console.error("Could not create student record:", error.message);
            return fail(`The user could not be created: ${error.message}`, 502);
          }
          return json({ ok: true, user: data }, 201);
        } catch (error) {
          console.error(
            "Could not create student record:",
            error instanceof Error ? error.message : error,
          );
          return fail(
            `The user could not be created: ${error instanceof Error ? error.message : "database request failed."}`,
            502,
          );
        }
      },
      PUT: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const auth = await authenticatedClient(request);
        if (auth instanceof Response) return auth;
        const id = userId(request);
        if (id === null) return fail("A valid user ID is required.", 400);
        const input = await readUserInput(request);
        if (input instanceof Response) return input;

        try {
          const { data, error } = await auth.db
            .from("student")
            .update(input)
            .eq("id", id)
            .select("*")
            .maybeSingle();
          if (error) {
            console.error("Could not update student record:", error.message);
            return fail(`The user could not be updated: ${error.message}`, 502);
          }
          if (!data) return fail("User not found.", 404);
          return json({ ok: true, user: data });
        } catch (error) {
          console.error(
            "Could not update student record:",
            error instanceof Error ? error.message : error,
          );
          return fail(
            `The user could not be updated: ${error instanceof Error ? error.message : "database request failed."}`,
            502,
          );
        }
      },
      DELETE: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const auth = await authenticatedClient(request);
        if (auth instanceof Response) return auth;
        const id = userId(request);
        if (id === null) return fail("A valid user ID is required.", 400);

        try {
          const { data, error } = await auth.db
            .from("student")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();
          if (error) {
            console.error("Could not delete student record:", error.message);
            return fail(`The user could not be deleted: ${error.message}`, 502);
          }
          if (!data) return fail("User not found.", 404);
          return json({ ok: true });
        } catch (error) {
          console.error(
            "Could not delete student record:",
            error instanceof Error ? error.message : error,
          );
          return fail(
            `The user could not be deleted: ${error instanceof Error ? error.message : "database request failed."}`,
            502,
          );
        }
      },
    },
  },
});
