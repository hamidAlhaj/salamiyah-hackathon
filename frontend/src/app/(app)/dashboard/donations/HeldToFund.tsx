'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { giveHeldToFundAction } from '@/lib/actions/donations';

/**
 * Money that arrived after the campaign was already full waits for the donor (docs/fund-contract.md):
 * one button gives it to the general council fund. Nothing happens without this deliberate click.
 */
export function HeldToFund({
  pledgeId,
  text,
  label,
  doneLabel,
}: {
  pledgeId: string;
  text: string;
  label: string;
  doneLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <div
      className="mt-3 rounded-xl border border-warning bg-warning-soft px-3 py-3 text-sm"
      data-testid="held-to-fund"
    >
      <p>{text}</p>
      {done ? (
        <p role="status" className="mt-2 font-semibold">
          {doneLabel}
        </p>
      ) : (
        <Button
          variant="give"
          size="sm"
          className="mt-2"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await giveHeldToFundAction(pledgeId);
              if (r.error !== undefined) setError(r.error);
              else {
                setDone(true);
                router.refresh();
              }
            })
          }
        >
          {label}
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
