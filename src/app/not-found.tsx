import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="page">
      <EmptyState
        headline="That page is not here."
        body="The essay may have been unpublished, or the link may be wrong."
        action={{ label: "Back to the feed", href: "/" }}
      />
    </main>
  );
}
