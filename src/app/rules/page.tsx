import Link from "next/link";

import { ClaimBadge } from "@/components/ui";

export const metadata = { title: "The writing rules · Lensa" };

export default function RulesPage() {
  return (
    <main className="page">
      <div className="measure pb-12">
        <div className="meta pb-5">The writing rules</div>
        <h1 className="display mb-6 [text-wrap:pretty]">
          What counts as a claim, and what it costs to make one
        </h1>
        <p className="lead m-0">
          Lensa has one rule and several consequences of it. The rule is that a reader should be able to
          see, without asking, how much weight any sentence in your essay is carrying. Everything below
          follows from that.
        </p>
      </div>

      <section className="measure rule-t pt-8 pb-12">
        <h2 className="subhead mb-6">The three kinds of claim</h2>

        <div className="flex items-baseline gap-4 pb-3">
          <ClaimBadge kind="textual" />
        </div>
        <p className="lead mb-5">
          The text says it. A Textual claim carries a citation and a quotation, and a reader who opens the
          citation should find the claim there without interpretation. If you cannot quote it, it is not
          Textual. An unsourced Textual claim is shown demoted to Interpretive with a dashed underline until
          it is sourced.
        </p>

        <div className="flex items-baseline gap-4 pt-5 pb-3">
          <ClaimBadge kind="interpretive" />
        </div>
        <p className="lead mb-5">
          The text supports it and does not state it. This is where most good essays live. Interpretive
          claims still cite, but the citation is evidence rather than proof, and another writer may read the
          same passage the other way. Contest is expected here and is not an accusation.
        </p>

        <div className="flex items-baseline gap-4 pt-5 pb-3">
          <ClaimBadge kind="speculative" />
        </div>
        <p className="lead mb-0">
          The text does not settle it. Counterfactuals, authorial intent, what a character would do off the
          page. Speculative claims need no citation, and they are never counted against you in the ledger.
          Marking a claim Speculative is not a confession; it is the cheapest way to keep it.
        </p>
      </section>

      <section className="measure rule-t pt-8 pb-12">
        <h2 className="subhead mb-6">What a citation requires</h2>
        <p className="lead mb-5">
          Three fields: the work, the chapter or episode, and a quotation of forty words or fewer. Page
          numbers are not accepted, because editions disagree and readers do not have yours. Adaptations are
          cited as their own work, never as the source text.
        </p>
        <p className="lead mb-2">
          A citation is attached to a paragraph, not to an essay. This is deliberate. It means the reader
          can check one sentence without reading a bibliography, and it means the cost of an unsupported
          paragraph falls on that paragraph alone.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <span className="meta border-b border-[color:var(--rule)] pb-[2px]">Ch. 36 · “The Quarter-Deck”</span>
          <span className="meta meta-accent border-b border-dashed border-[color:var(--accent)] pb-[2px]">
            No source
          </span>
        </div>
      </section>

      <section className="measure rule-t pt-8 pb-12">
        <h2 className="subhead mb-6">The steelman gate</h2>
        <p className="lead mb-5">
          Before you may publish a counterpoint, you must state the argument you are opposing in a form its
          author would accept, and they get to say whether you have. The gate is two steps and it cannot be
          skipped. It applies to counterpoints only, never to an ordinary essay.
        </p>
        <p className="lead mb-0">
          It exists because the cheapest essay to write is one that argues with a version of the other
          reading that nobody holds. The gate makes that essay expensive. It also means a published
          counterpoint arrives with the original writer&rsquo;s acknowledgement attached, which is worth more
          than any voting mechanism we could have built instead.
        </p>
        <div className="quiet-bar mt-6">
          <p className="serif-md m-0 text-[color:var(--ink2)]">
            A fairness mark is the original author saying you understood them. It is not agreement, and it
            does not travel with your conclusion.
          </p>
        </div>
      </section>

      <section className="measure rule-t pt-8 pb-12">
        <h2 className="subhead mb-6">Why there are only six lenses</h2>
        <p className="lead mb-5">
          Nietzschean, Jungian, Psychoanalytic, Metafictional, Sociopolitical, Narratological. An essay may
          carry two at most.
        </p>
        <p className="lead mb-5">
          Six is not a claim about the history of criticism. It is a working limit. An open tag field turns
          into a thousand tags with four essays each, and a reader browsing by lens finds nothing. Two per
          essay is the same argument at a smaller scale: an essay that needs three lenses is usually two
          essays that have not been separated yet.
        </p>
        <p className="lead mb-0">
          The list will grow when a lens is proposed with essays already written under it. It will not grow
          because a lens sounds like it should exist.
        </p>
      </section>

      <section className="measure rule-t pt-8 pb-12">
        <h2 className="subhead mb-6">All analysis here is human</h2>
        <p className="lead mb-5">
          Nothing on this platform is generated. No model reads your draft, proposes lenses, writes
          counterarguments, or flags a paragraph as speculation. There is no assistant in the editor, no
          chat, and no persona standing between you and the page.
        </p>
        <p className="lead mb-5">
          What the editor gives you instead is a mirror. A checklist you tick yourself before publishing. The
          six lens definitions written out where you choose, so you are picking a method rather than a word.
          And a self audit that strips every piece of formatting and shows your blocks as a column of claim
          types — twelve consecutive Speculative badges is a fact about your essay, and seeing it yourself is
          worth more than being told.
        </p>
        <p className="lead mb-0">
          Every word visible on Lensa was written by a person. That holds because the feature does not exist,
          not because a policy forbids it.
        </p>
      </section>

      <section className="measure rule-t pt-8">
        <p className="lead mb-6">
          None of this is enforced by moderation. It is enforced by the fact that every claim you make is
          visible as a claim, and that anyone reading can see exactly which ones you did not source.
        </p>
        <Link href="/write" className="btn btn-strong plain">
          Start an essay
        </Link>
      </section>
    </main>
  );
}
