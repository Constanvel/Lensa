import { Inventory } from "./inventory";
import { MetadataLabel } from "@/components/kit";

export const metadata = { title: "Component states · Lensa" };

/**
 * The whole component inventory, every state, both themes, one page.
 * It ships with the app on purpose: a states page that lives in a separate
 * tool is a states page that stops matching the product.
 */
export default function ComponentStatesPage() {
  return (
    <main className="page">
      <div className="measure pb-12">
        <div className="meta pb-5">Design · component states</div>
        <h1 className="title mb-5">Every component, every state, both themes</h1>
        <p className="lead m-0 mb-5">
          Each specimen is the real component, not a copy of it. Hover, focus and active are rendered
          through <code className="font-sans text-[15px]">data-force</code>, which the stylesheet lists in
          the same rule as the pseudo-class — so a specimen here cannot drift from what the product does.
        </p>
        <p className="lead m-0">
          No component writes a colour. Every hex in the product lives in the token block at the top of{" "}
          <code className="font-sans text-[15px]">src/app/globals.css</code>, and the two theme blocks
          under it.
        </p>
      </div>

      <div className="rule-t rule-b mb-12 grid gap-6 py-7 sm:grid-cols-2">
        <div>
          <MetadataLabel tone="ink">The touch target</MetadataLabel>
          <p className="note-lg mt-2 mb-0">
            Every text button — including the destructive action, the citation chip&rsquo;s neighbours and
            the toast dismiss — takes its 44px target from{" "}
            <code className="font-sans">.text-btn::after &#123; inset: -12px -8px &#125;</code>. The
            underline hugs the text and nothing on the page shifts to make room.
          </p>
        </div>
        <div>
          <MetadataLabel tone="ink">The resting boundary</MetadataLabel>
          <p className="note-lg mt-2 mb-0">
            Inputs, textareas, selects, the search field, unchecked checkboxes, unselected chips and the
            secondary button all rest on <code className="font-sans">--edge</code>. Only dividers, card and
            toast borders, row separators and disabled controls use{" "}
            <code className="font-sans">--rule</code>, which is 1.3:1 on paper and fails as a control
            boundary.
          </p>
        </div>
      </div>

      {(["light", "dark"] as const).map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          className="mb-10 border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-8 text-[color:var(--ink)] sm:px-8"
        >
          <div className="mb-8 flex items-baseline gap-4">
            <MetadataLabel tone="ink">{theme === "light" ? "Light" : "Dark"}</MetadataLabel>
            <MetadataLabel wrap>
              {theme === "light"
                ? "paper #FAF8F3 · edge #8F8678 · focus #1A1815"
                : "paper #171512 · edge #6E675E · focus #EDE7DC"}
            </MetadataLabel>
          </div>
          <Inventory />
        </section>
      ))}
    </main>
  );
}
