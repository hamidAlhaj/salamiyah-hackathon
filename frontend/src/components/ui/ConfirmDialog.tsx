'use client';

import { useRef } from 'react';
import { buttonClasses } from './Button';
import { Modal } from './Modal';

// Reusable destructive-action confirmation, built on the shared Modal (Escape
// support, focus trap, focus restoration come from there - see Modal.tsx).
// Default focus sits on Cancel, never on Confirm, so a stray Enter/click
// can't accidentally run the destructive action - see the Phase A audit (§5).
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  /** Labels are passed in already translated. */
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  if (!open) return null;

  return (
    <Modal title={title} onClose={onCancel} closeLabel={cancelLabel} initialFocusRef={cancelRef}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-muted">{description}</div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className={buttonClasses('secondary')}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={buttonClasses(danger ? 'danger' : 'primary')}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
