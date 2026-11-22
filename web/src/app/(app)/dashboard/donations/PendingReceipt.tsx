'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ReceiptUpload } from '@/components/donate/ReceiptUpload';

/** "Upload the receipt later": a transfer pledge from the list, opened on demand. */
export function PendingReceipt({
  pledgeId,
  campaignSlug,
  label,
}: {
  pledgeId: string;
  campaignSlug: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <details
      className="mt-4 rounded-xl border border-border px-4 py-3"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-semibold text-accent">{label}</summary>
      <div className="mt-4">
        <ReceiptUpload
          pledgeId={pledgeId}
          campaignSlug={campaignSlug}
          onDone={() => router.refresh()}
        />
      </div>
    </details>
  );
}
