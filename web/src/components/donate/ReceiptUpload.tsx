'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Field, labelClass } from '@/components/ui/Field';
import { FormError } from '@/components/ui/FormParts';
import { Button } from '@/components/ui/Button';
import { uploadReceiptAction } from '@/lib/actions/donations';
import type { PledgeView } from '@/shared';

const FILE_INPUT =
  'block w-full text-sm text-ink file:me-3 file:rounded-xl file:border-0 file:bg-accent-soft ' +
  'file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-strong hover:file:brightness-95';

/**
 * Receipt photo for a transfer pledge → RECEIPT_UPLOADED + a finance verification. Two inputs share
 * the name: `capture` opens the phone camera directly, the other keeps gallery / PDF upload.
 */
export function ReceiptUpload({
  pledgeId,
  campaignSlug,
  onDone,
}: {
  pledgeId: string;
  campaignSlug: string;
  onDone: (pledge: PledgeView) => void;
}) {
  const t = useTranslations('donate.transfer');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const hasFile = formData.getAll('receipt').some((f) => f instanceof File && f.size > 0);
    if (!hasFile) {
      setError(t('noFile'));
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await uploadReceiptAction(formData);
      if (result.error !== undefined) setError(result.error);
      else onDone(result.data);
    });
  }

  return (
    <form action={submit} className="space-y-4" data-testid="receipt-form">
      <input type="hidden" name="pledgeId" value={pledgeId} />
      <input type="hidden" name="campaignSlug" value={campaignSlug} />
      <fieldset className="space-y-3" aria-describedby={`receipt-hint-${pledgeId}`}>
        <legend className={labelClass}>{t('receiptTitle')}</legend>
        <div className="space-y-1">
          <label htmlFor={`receipt-camera-${pledgeId}`} className="block text-sm text-muted">
            {t('camera')}
          </label>
          <input
            id={`receipt-camera-${pledgeId}`}
            name="receipt"
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className={FILE_INPUT}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`receipt-file-${pledgeId}`} className="block text-sm text-muted">
            {t('gallery')}
          </label>
          <input
            id={`receipt-file-${pledgeId}`}
            name="receipt"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className={FILE_INPUT}
            data-testid="receipt-file"
          />
        </div>
        <p id={`receipt-hint-${pledgeId}`} className="text-xs text-muted">
          {t('receiptHint')}
        </p>
      </fieldset>
      <Field
        id={`transfer-ref-${pledgeId}`}
        label={t('transferRef')}
        name="transferRef"
        dir="ltr"
        maxLength={60}
        autoComplete="off"
      />
      <FormError message={error} />
      <Button type="submit" variant="give" size="lg" className="w-full" disabled={pending}>
        {pending ? '…' : t('upload')}
      </Button>
    </form>
  );
}
