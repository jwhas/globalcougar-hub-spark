import { createFileRoute } from "@tanstack/react-router";
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

async function authenticationError(request: Request): Promise<Response | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) {
    return fail("Sign in to manage users.", 401);
  }

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    console.error("User management authentication is not configured.");
    return fail("User management is not configured.", 503);
  }

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: authorization },
    });
    if (!response.ok) return fail("Sign in to manage users.", 401);

    const user: unknown = await response.json();
    if (!user || typeof user !== "object" || !("id" in user) || typeof user.id !== "string") {
      return fail("Sign in to manage users.", 401);
    }
    return null;
  } catch (error) {
    console.error("Could not verify user management session:", error);
    return fail("Authentication is temporarily unavailable.", 503);
  }
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
        const authError = await authenticationError(request);
        if (authError) return authError;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("student")
            .select("*")
            .order("id", { ascending: true });
          if (error) throw error;
          return json({ ok: true, users: data ?? [] });
        } catch (error) {
          console.error(
            "Could not load student records:",
            error instanceof Error ? error.message : error,
          );
          return fail("Users could not be loaded.", 502);
        }
      },
      POST: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const authError = await authenticationError(request);
        if (authError) return authError;
        const input = await readUserInput(request);
        if (input instanceof Response) return input;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("student")
            .insert(input)
            .select("*")
            .single();
          if (error) throw error;
          return json({ ok: true, user: data }, 201);
        } catch (error) {
          console.error(
            "Could not create student record:",
            error instanceof Error ? error.message : error,
          );
          return fail("The user could not be created.", 502);
        }
      },
      PUT: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const authError = await authenticationError(request);
        if (authError) return authError;
        const id = userId(request);
        if (id === null) return fail("A valid user ID is required.", 400);
        const input = await readUserInput(request);
        if (input instanceof Response) return input;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("student")
            .update(input)
            .eq("id", id)
            .select("*")
            .maybeSingle();
          if (error) throw error;
          if (!data) return fail("User not found.", 404);
          return json({ ok: true, user: data });
        } catch (error) {
          console.error(
            "Could not update student record:",
            error instanceof Error ? error.message : error,
          );
          return fail("The user could not be updated.", 502);
        }
      },
      DELETE: async ({ request }) => {
        if (!sameOrigin(request)) return fail("Only this site can manage users.", 403);
        const authError = await authenticationError(request);
        if (authError) return authError;
        const id = userId(request);
        if (id === null) return fail("A valid user ID is required.", 400);

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("student")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();
          if (error) throw error;
          if (!data) return fail("User not found.", 404);
          return json({ ok: true });
        } catch (error) {
          console.error(
            "Could not delete student record:",
            error instanceof Error ? error.message : error,
          );
          return fail("The user could not be deleted.", 502);
        }
      },
    },
  },
});
