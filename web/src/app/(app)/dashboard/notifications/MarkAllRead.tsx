'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { markAllNotificationsReadAction } from '@/lib/actions/notifications';

export function MarkAllRead({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}
