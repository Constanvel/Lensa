import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          // Server Components cannot set cookies; proxy.ts refreshes the session.
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}

/** The signed-in user, or null. Reading needs no account; writing does. */
export async function currentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function currentProfile() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, lenses, onboarded_at")
    .eq("id", data.user.id)
    .maybeSingle();

  return profile ?? null;
}
