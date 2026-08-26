import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import { cookies } from "next/headers";

import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { currentProfile } from "@/lib/supabase/server";
import { readingProgress } from "@/lib/queries";

/** Literata carries the argument. Inter carries the chrome. */
const literata = Literata({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-literata",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lensa",
  description:
    "Analytical essays on fictional characters, with every claim marked Textual, Interpretive, or Speculative.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = store.get("lensa.theme")?.value;
  const collapsed = store.get("lensa.rail")?.value === "1";

  const profile = await currentProfile();
  const progress = profile ? await readingProgress(profile.id) : [];

  return (
    // The font variables live on :root so --font-sans resolves where it is declared.
    <html
      lang="en"
      data-theme={theme === "dark" || theme === "light" ? theme : undefined}
      className={`${literata.variable} ${inter.variable}`}
    >
      <body>
        <AppShell
          collapsed={collapsed}
          viewer={profile ? { handle: profile.handle, display_name: profile.display_name } : null}
          progress={progress}
          footer={<SiteFooter />}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
