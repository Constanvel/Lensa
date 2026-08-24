import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { saveProfile, saveReadingPositions, signOut, toggleTheme } from "@/lib/actions";
import { readingProgress } from "@/lib/queries";
import { currentProfile, currentUser } from "@/lib/supabase/server";

export const metadata = { title: "Settings · Lensa" };

export default async function SettingsPage() {
  const [profile, user, store] = await Promise.all([currentProfile(), currentUser(), cookies()]);
  if (!profile || !user) redirect("/signin");

  const theme = store.get("lensa.theme")?.value === "dark" ? "dark" : "light";
  const progress = await readingProgress(profile.id);

  return (
    <main className="mx-auto max-w-[680px] px-6 pt-12 pb-24">
      <h1 className="title mb-12">Settings</h1>

      <section className="pb-14">
        <h2 className="meta mb-5">Account</h2>

        <form action={saveProfile}>
          <div className="rule-t py-5">
            <label className="label" htmlFor="display_name">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              defaultValue={profile.display_name}
              className="field"
            />
          </div>

          <div className="rule-t py-5">
            <label className="label" htmlFor="bio">
              About you
            </label>
            <textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} className="field" />
          </div>

          <div className="rule-t py-5">
            <span className="label">Email</span>
            <div className="field field-ui flex items-center border-b-[color:var(--rule)]">{user.email}</div>
            <p className="note mt-[10px] mb-0">
              Used for sign-in links only. Lensa sends nothing else. Changing it needs a new link.
            </p>
          </div>

          <div className="rule-t rule-b flex items-center gap-4 py-5">
            <span className="serif-md flex-1">Public handle</span>
            <span className="meta">@{profile.handle}</span>
          </div>

          <button type="submit" className="btn btn-strong mt-6">
            Save account
          </button>
        </form>

        <form action={toggleTheme.bind(null, theme)}>
          <div className="rule-t rule-b mt-6 flex items-center gap-4 py-5">
            <span className="serif-md flex-1">Theme</span>
            <button type="submit" className="btn">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </form>
      </section>

      <section className="pb-14">
        <h2 className="meta mb-3">Reading progress</h2>
        <p className="note-lg m-0 mb-5 max-w-[560px] text-[color:var(--ink2)]">
          Position governs which paragraphs stay blurred. Set it per work here, or from the rail while
          reading.
        </p>

        {progress.length === 0 ? (
          <p className="note-lg rule-t rule-b py-5">
            No works tracked. Pick one from any work page and it will appear here.
          </p>
        ) : (
          <form action={saveReadingPositions}>
            {progress.map(({ work, position }, i) => (
              <div
                key={work.id}
                className={`rule-t flex items-baseline gap-3 py-4 ${
                  i === progress.length - 1 ? "rule-b" : ""
                }`}
              >
                <span className="serif-md flex-1">{work.title}</span>
                <input
                  name={`position:${work.id}`}
                  defaultValue={position}
                  inputMode="numeric"
                  className="field field-num"
                  aria-label={`Position in ${work.title}`}
                />
                <span className="meta">
                  of {work.unit_count ?? "—"} {work.unit_label}
                </span>
              </div>
            ))}
            <button type="submit" className="btn btn-strong mt-6">
              Save positions
            </button>
          </form>
        )}
      </section>

      <section className="pb-14">
        <h2 className="meta mb-5">Session</h2>
        <form action={signOut}>
          <div className="rule-t rule-b flex items-center gap-4 py-5">
            <span className="serif-md flex-1">Signed in as {user.email}</span>
            <button type="submit" className="btn">
              Sign out
            </button>
          </div>
        </form>
      </section>

      {/* Oxblood text on paper, never a filled button. */}
      <section>
        <h2 className="meta meta-accent mb-3">Danger zone</h2>
        <p className="note-lg m-0 mb-5 max-w-[560px] text-[color:var(--ink2)]">
          Both actions are irreversible. Export first if you want a copy.
        </p>

        <div className="rule-t flex items-center gap-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="serif-md mb-1">Export my essays</div>
            <div className="note">
              Every draft and published essay, with citations and revision history, as plain text.
            </div>
          </div>
          <a href="/api/export" className="text-btn text-btn-accent plain">
            Export
          </a>
        </div>

        <div className="rule-t rule-b flex items-center gap-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="serif-md mb-1">Delete account</div>
            <div className="note">
              Published essays stay up, credited to a deleted account, because counterpoints depend on them.
              Drafts are destroyed. Deletion needs a confirmation link — write to support and one is sent to
              the address above.
            </div>
          </div>
          <a href={`mailto:support@lensa.app?subject=Delete%20account%20${profile.handle}`} className="text-btn text-btn-accent plain">
            Request deletion
          </a>
        </div>
      </section>
    </main>
  );
}
