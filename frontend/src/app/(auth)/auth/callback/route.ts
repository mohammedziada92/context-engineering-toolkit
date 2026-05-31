import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function sanitizeNext(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNext(searchParams.get("next"));

  const supabase = await createServerSupabaseClient();

  // PKCE flow (OAuth + magic link with code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin).toString());
    }
  }

  // Implicit flow (magic link with token_hash)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "magiclink" | "signup" | "email" });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin).toString());
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
