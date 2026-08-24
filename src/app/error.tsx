"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <div className="max-w-[560px]">
        <p className="head-sm m-0 mb-[10px] text-[color:var(--ink)]">Something failed on our end.</p>
        <p className="note-lg m-0 mb-4">
          The request did not complete. Nothing you had written was lost.
        </p>
        <button type="button" onClick={reset} className="text-btn text-btn-accent">
          Try again
        </button>
      </div>
    </main>
  );
}
