'use client';

import { buttonClasses } from '@/components/ui/Button';

/** Opens the browser print dialog; the print stylesheet hides everything but the receipt. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClasses('secondary', 'md')}
      data-testid="print-receipt"
    >
      {label}
    </button>
  );
}
