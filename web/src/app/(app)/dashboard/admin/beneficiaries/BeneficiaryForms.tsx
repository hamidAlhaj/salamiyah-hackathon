'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import {
  addBeneficiaryNoteAction,
  beneficiarySuspensionAction,
  endLinkAction,
  linkBeneficiaryAction,
  updateBeneficiaryAction,
  updateLinkAction,
} from '@/lib/actions/beneficiaries';
import type { StaffBeneficiary } from '@/lib/types/staff';
import { BENEFICIARY_KINDS } from '@/shared';

/** ADMIN corrects the record. The public code is fixed; name and phone stay private. */
export function EditBeneficiaryForm({ beneficiary }: { beneficiary: StaffBeneficiary }) {
  const t = useTranslations('adminSetup');
  const tKinds = useTranslations('campaign.kinds');
  const tCommon = useTranslations('common');
  const prefix = `b-${beneficiary.id}`;
  return (
    <ActionForm
      action={updateBeneficiaryAction}
      submitLabel={tCommon('save')}
      pendingLabel={tCommon('saving')}
      testId="beneficiary-edit-form"
    >
      <input type="hidden" name="id" value={beneficiary.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          as="select"
          id={`${prefix}-kind`}
          label={t('beneficiaries.kind')}
          name="kind"
          defaultValue={beneficiary.kind}
        >
          {BENEFICIARY_KINDS.map((k) => (
            <option key={k} value={k}>
              {tKinds(k)}
            </option>
          ))}
        </Field>
        <Field
          id={`${prefix}-area`}
          label={t('beneficiaries.area')}
          name="area"
          maxLength={60}
          defaultValue={beneficiary.area ?? ''}
        />
        <Field
          id={`${prefix}-name`}
          label={t('beneficiaries.fullName')}
          name="fullName"
          required
          minLength={3}
          maxLength={120}
          defaultValue={beneficiary.fullName}
        />
        <Field
          id={`${prefix}-phone`}
          label={t('beneficiaries.phone')}
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={beneficiary.phone ?? ''}
        />
      </div>
    </ActionForm>
  );
}

/** ADMIN links the beneficiary to a campaign (monthly amount only for sponsorships). */
export function LinkForm({
  beneficiaryId,
  campaigns,
}: {
  beneficiaryId: string;
  campaigns: { id: string; title: string }[];
}) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const prefix = `link-${beneficiaryId}`;
  return (
    <ActionForm
      action={linkBeneficiaryAction}
      submitLabel={t('beneficiaries.link')}
      pendingLabel={tCommon('saving')}
      variant="secondary"
      resetOnSuccess
      testId="beneficiary-link-form"
    >
      <input type="hidden" name="beneficiaryId" value={beneficiaryId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          as="select"
          id={`${prefix}-campaign`}
          label={t('payments.campaign')}
          name="campaignId"
          required
          defaultValue=""
        >
          <option value="" disabled>
            {t('beneficiaries.choosePlaceholder')}
          </option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Field>
        <Field
          id={`${prefix}-monthly`}
          label={`${t('beneficiaries.monthlyAmount')} (${tCommon('optional')})`}
          name="monthlyAmount"
          inputMode="numeric"
          dir="ltr"
          hint={t('beneficiaries.monthlyHint')}
        />
      </div>
    </ActionForm>
  );
}

/** ADMIN changes the monthly amount of one link or ends it (history stays). */
export function LinkControls({
  beneficiaryId,
  campaignId,
  slug,
  monthlyAmount,
}: {
  beneficiaryId: string;
  campaignId: string;
  slug: string;
  monthlyAmount: string | null;
}) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const hidden = (
    <>
      <input type="hidden" name="beneficiaryId" value={beneficiaryId} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
    </>
  );
  return (
    <div className="flex flex-wrap items-end gap-3">
      {monthlyAmount !== null && (
        <ActionForm
          action={updateLinkAction}
          submitLabel={tCommon('save')}
          pendingLabel={tCommon('saving')}
          variant="secondary"
          submitClassName="!px-3 !py-1.5 !text-sm"
          className="flex flex-wrap items-end gap-2 !space-y-0"
        >
          {hidden}
          <Field
            id={`m-${beneficiaryId}-${campaignId}`}
            label={t('beneficiaries.monthlyAmount')}
            name="monthlyAmount"
            inputMode="numeric"
            dir="ltr"
            required
            defaultValue={String(Math.round(Number(monthlyAmount)))}
          />
        </ActionForm>
      )}
      <ActionForm
        action={endLinkAction}
        submitLabel={t('beneficiaries.end')}
        pendingLabel={tCommon('saving')}
        variant="secondary"
        submitClassName="!px-3 !py-1.5 !text-sm"
        className="!space-y-2"
        testId="end-link"
      >
        {hidden}
      </ActionForm>
    </div>
  );
}

/**
 * ADMIN places the record on administrative hold or lifts it, always with a reason. Intake staff then
 * only get a generic refusal for this national ID; public pages do not change.
 */
export function SuspensionForm({
  beneficiaryId,
  isSuspended,
}: {
  beneficiaryId: string;
  isSuspended: boolean;
}) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  return (
    <ActionForm
      action={beneficiarySuspensionAction}
      submitLabel={
        isSuspended ? t('beneficiaries.hold.reactivate') : t('beneficiaries.hold.suspend')
      }
      pendingLabel={tCommon('saving')}
      variant={isSuspended ? 'primary' : 'danger'}
      submitClassName="!px-3 !py-1.5 !text-sm"
      testId="beneficiary-suspension-form"
    >
      <input type="hidden" name="id" value={beneficiaryId} />
      <input type="hidden" name="suspend" value={isSuspended ? 'false' : 'true'} />
      <Field
        as="textarea"
        id={`hold-${beneficiaryId}-reason`}
        label={t('beneficiaries.hold.reason')}
        name="reason"
        required
        minLength={5}
        maxLength={1000}
        rows={2}
      />
    </ActionForm>
  );
}

/** ADMIN adds a note or a violation to the internal log. */
export function NoteForm({ beneficiaryId }: { beneficiaryId: string }) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const prefix = `note-${beneficiaryId}`;
  return (
    <ActionForm
      action={addBeneficiaryNoteAction}
      submitLabel={t('beneficiaries.log.add')}
      pendingLabel={tCommon('saving')}
      variant="secondary"
      submitClassName="!px-3 !py-1.5 !text-sm"
      resetOnSuccess
      testId="beneficiary-note-form"
    >
      <input type="hidden" name="id" value={beneficiaryId} />
      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Field
          as="select"
          id={`${prefix}-kind`}
          label={t('beneficiaries.log.kind')}
          name="kind"
          defaultValue="NOTE"
        >
          <option value="NOTE">{t('beneficiaries.log.kinds.NOTE')}</option>
          <option value="VIOLATION">{t('beneficiaries.log.kinds.VIOLATION')}</option>
        </Field>
        <Field
          id={`${prefix}-body`}
          label={t('beneficiaries.log.body')}
          name="body"
          required
          minLength={5}
          maxLength={1000}
        />
      </div>
    </ActionForm>
  );
}
