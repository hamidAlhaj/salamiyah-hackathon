'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActionForm } from '@/components/forms/ActionForm';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { approveVerificationAction, rejectVerificationAction } from '@/lib/actions/verifications';

/**
 * Approve (issues the official receipt when the donation is named) or reject with a required reason
 * the donor will read. Separation of duties: a verifier never decides an entry they recorded or
 * donated; the buttons stay visible but disabled, with the reason.
 */
export function FinanceActions({
  id,
  reference,
  ownEntry,
}: {
  id: string;
  reference: string;
  ownEntry: boolean;
}) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const [rejecting, setRejecting] = useState(false);

  if (ownEntry) {
    return (
      <div className="space-y-2" data-testid={`own-entry-${reference}`}>
        <div className="flex flex-wrap gap-3">
          <Button disabled aria-describedby={`own-${id}`}>
            {t('approve')}
          </Button>
          <Button variant="secondary" disabled aria-describedby={`own-${id}`}>
            {t('reject')}
          </Button>
        </div>
        <p id={`own-${id}`} className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted">
          {t('ownEntry')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionForm
        action={approveVerificationAction}
        submitLabel={t('approve')}
        pendingLabel={tCommon('saving')}
        testId={`approve-${reference}`}
      >
        <input type="hidden" name="id" value={id} />
      </ActionForm>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setRejecting(true)}
        data-testid={`reject-open-${reference}`}
      >
        {t('reject')}
      </Button>
      {rejecting && (
        <Modal
          title={t('rejectTitle', { reference })}
          onClose={() => setRejecting(false)}
          closeLabel={tCommon('cancel')}
        >
          <p className="text-sm text-muted">{t('rejectIntro')}</p>
          <div className="mt-4" data-testid="reject-dialog">
            <ActionForm
              action={rejectVerificationAction}
              submitLabel={t('rejectConfirm')}
              pendingLabel={tCommon('saving')}
              variant="danger"
              onResult={(state) => state.ok && setRejecting(false)}
            >
              <input type="hidden" name="id" value={id} />
              <Field
                as="textarea"
                id={`reason-${id}`}
                label={t('reason')}
                name="reason"
                hint={t('reasonHint')}
                required
                minLength={5}
                maxLength={500}
                rows={3}
              />
            </ActionForm>
          </div>
        </Modal>
      )}
    </div>
  );
}
