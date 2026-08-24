import { NextResponse, type NextRequest } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";

/** Magic-link and OAuth landing. A spent or stale link lands on the expired state. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.redirect(new URL("/signin?expired=1", url.origin));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/signin?expired=1", url.origin));

  const { data } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", data.user!.id)
    .maybeSingle();

  return NextResponse.redirect(new URL(profile?.onboarded_at ? "/" : "/welcome", url.origin));
}
