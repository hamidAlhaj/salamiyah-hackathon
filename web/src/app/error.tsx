'use client';

import { ErrorState } from '@/components/ui/States';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="px-4">
      <ErrorState reset={reset} />
    </main>
  );
}
