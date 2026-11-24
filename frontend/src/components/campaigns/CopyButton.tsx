'use client';

import { useState } from 'react';

/** Copies a value (e.g. an account number) and confirms in place; announced to screen readers. */
export function CopyButton({
  value,
  label,
  copyText,
  copiedText,
}: {
  value: string;
  /** Accessible name, e.g. "Copy the Syriatel Cash account number". */
  label: string;
  copyText: string;
  copiedText: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (insecure context): the number stays selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-accent hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-live="polite">{copied ? copiedText : copyText}</span>
    </button>
  );
}
