import type { SupabaseContext, WithSupabaseConfig } from "@supabase/server";
import { createSupabaseContextForRequest } from "@/lib/supabase/context";

/**
 * Next.js App Router adapter for `@supabase/server`'s `withSupabase`.
 *
 * Cookie sessions are composed with `@supabase/ssr` (see `lib/supabase/context.ts`).
 * Export the returned handler as a route method:
 *
 * ```ts
 * export const GET = withSupabase({ auth: "user" }, async (_req, ctx) => {
 *   const { data } = await ctx.supabase.from("todos").select();
 *   return Response.json(data);
 * });
 * ```
 */
export function withSupabase<Database = unknown>(
  config: WithSupabaseConfig,
  handler: (
    req: Request,
    ctx: SupabaseContext<Database>
  ) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const { data: ctx, error } = await createSupabaseContextForRequest(req, {
      auth: config.auth,
      env: config.env,
    });

    if (error) {
      const status = "status" in error ? (error.status as number) : 500;
      const code = "code" in error ? (error.code as string) : undefined;
      return Response.json(
        { message: error.message, ...(code ? { code } : {}) },
        { status }
      );
    }

    return handler(req, ctx as SupabaseContext<Database>);
  };
}
