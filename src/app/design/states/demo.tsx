"use client";

import { useState } from "react";

import { TextButton, Toast } from "@/components/kit";

/** The dismissible variant needs a handler, which a Server Component cannot pass. */
export function DismissibleToastSpec() {
  const [shown, setShown] = useState(true);

  if (!shown) {
    return (
      <div className="toast">
        <span className="toast-body">
          <span className="loading">Dismissed</span>
        </span>
        <TextButton underline={false} onClick={() => setShown(true)}>
          Restore
        </TextButton>
      </div>
    );
  }

  return (
    <Toast tone="done" title="Saved" onDismiss={() => setShown(false)}>
      Citation attached to paragraph 3.
    </Toast>
  );
}
