import Link from "next/link";

import { LENSES, LENS_KEYS } from "@/lib/lenses";
import { lensTallies } from "@/lib/queries";

export const metadata = { title: "Six lenses · Lensa" };

export default async function LensesPage() {
  const tally = await lensTallies();

  return (
    <main className="page">
      <div className="measure pb-14">
        <h1 className="title mb-5">Six lenses</h1>
        <p className="lead m-0">
          The taxonomy is closed. An essay declares at most two lenses, which is what makes disagreement
          locatable — two writers can be shown to be reading the same character through the same instrument
          and still arriving elsewhere.
        </p>
      </div>

      <div className="rule-t grid grid-cols-1 sm:grid-cols-2">
        {LENS_KEYS.map((key, i) => (
          <Link
            key={key}
            href={`/?lens=${key}`}
            className={`plain row-hover rule-b block cursor-pointer py-8 ${
              i % 2 === 0 ? "sm:border-r sm:border-[color:var(--rule)] sm:pr-8" : "sm:pl-8"
            }`}
          >
            <h2 className="subhead mb-3">{LENSES[key].name}</h2>
            <p className="lead m-0 mb-5 max-w-[34ch]">{LENSES[key].long}</p>
            <div className="meta">{tally[key] ?? 0} essays</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
