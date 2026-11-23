'use client';

import { ErrorState } from '@/components/ui/States';

/** Errors inside this group keep its header and navigation (the root error.tsx replaces them). */
export default function GroupError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-4">
      <ErrorState reset={reset} />
    </div>
  );
}
