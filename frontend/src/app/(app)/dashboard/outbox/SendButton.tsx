'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { buttonClasses } from '@/components/ui/Button';
import { markOutboxOpenedAction } from '@/lib/actions/notifications';

export function WhatsAppGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .9a4 4 0 0 1-2.2-2.2l.9-1-1-2z" />
    </svg>
  );
}

/**
 * One tap: opens the prefilled wa.me message on the council phone (a new tab / the WhatsApp app)
 * and marks the row OPENED. The server never sends anything itself.
 */
export function SendButton({
  id,
  openUrl,
  label,
  opened,
  onOpened,
}: {
  id: string;
  openUrl: string;
  label: string;
  opened: boolean;
  onOpened?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <a
      href={openUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        startTransition(async () => {
          await markOutboxOpenedAction(id);
          if (onOpened) onOpened();
          else router.refresh();
        })
      }
      aria-busy={pending || undefined}
      className={buttonClasses(opened ? 'secondary' : 'primary', 'md', 'whitespace-nowrap')}
      data-testid="whatsapp-send"
    >
      <WhatsAppGlyph />
      {label}
    </a>
  );
}
