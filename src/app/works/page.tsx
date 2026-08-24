import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { MEDIUM_LABEL } from "@/lib/types";
import { workList } from "@/lib/queries";

export const metadata = { title: "Works · Lensa" };

export default async function WorksPage() {
  const works = await workList();

  return (
    <main className="page">
      <div className="measure pb-10">
        <h1 className="title mb-4">Works</h1>
        <p className="lead m-0">
          Essays are written against specific works. A work holds the character pages, and the reading
          position that decides which paragraphs stay blurred.
        </p>
      </div>

      {works.length === 0 ? (
        <div className="rule-t pt-12">
          <EmptyState
            headline="No works yet."
            body="A work is created the first time someone adds a character from it."
            action={{ label: "Add a character", href: "/characters/new" }}
          />
        </div>
      ) : (
        <div>
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/w/${work.slug}`}
              className="plain row row-hover flex flex-wrap items-baseline gap-4 px-2 -ml-2"
            >
              <span className="serif-md flex-1">{work.title}</span>
              <span className="meta">
                {MEDIUM_LABEL[work.medium]}
                {work.creator ? ` · ${work.creator}` : ""}
                {work.unit_count ? ` · ${work.unit_count} ${work.unit_label}` : ""}
              </span>
            </Link>
          ))}
          <div className="rule-t" />
        </div>
      )}
    </main>
  );
}
