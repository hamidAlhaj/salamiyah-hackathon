'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { recordCashAction } from '@/lib/actions/collector';
import type { CollectorPoint } from '@/shared';

/** A box total (or an anonymous amount) collected for a campaign at one of my points. */
export function RecordCashForm({
  points,
  campaigns,
}: {
  points: CollectorPoint[];
  campaigns: { id: string; title: string }[];
}) {
  const t = useTranslations('collector');
  return (
    <ActionForm
      action={recordCashAction}
      submitLabel={t('recordSubmit')}
      pendingLabel={t('recording')}
      resetOnSuccess
      testId="record-cash-form"
    >
      <Field as="select" label={t('recordCampaign')} name="campaignId" required>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </Field>
      <Field as="select" label={t('recordPoint')} name="collectionPointId" required>
        {points.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Field>
      <Field
        label={t('recordAmount')}
        name="amount"
        inputMode="numeric"
        dir="ltr"
        required
        pattern="[0-9]+"
        autoComplete="off"
      />
      <Field
        label={t('recordDonor')}
        name="donorName"
        hint={t('recordDonorHint')}
        maxLength={120}
      />
    </ActionForm>
  );
}
