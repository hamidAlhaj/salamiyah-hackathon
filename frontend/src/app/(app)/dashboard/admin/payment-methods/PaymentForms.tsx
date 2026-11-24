'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import {
  removeCampaignOverrideAction,
  setCampaignOverrideAction,
  updatePaymentMethodAction,
} from '@/lib/actions/payment-methods';
import type { CampaignAccountOverride, PaymentMethodConfigRow } from '@/lib/types/staff';

/** Edit a method's default receiving details. Empty optional fields are cleared. */
export function ConfigForm({ config }: { config: PaymentMethodConfigRow }) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const prefix = `pm-${config.method}`;
  return (
    <ActionForm
      action={updatePaymentMethodAction}
      submitLabel={tCommon('save')}
      pendingLabel={tCommon('saving')}
      testId={`config-form-${config.method}`}
    >
      <input type="hidden" name="method" value={config.method} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-labelAr`}
          label={t('payments.labelAr')}
          name="labelAr"
          required
          minLength={2}
          maxLength={60}
          defaultValue={config.labelAr}
        />
        <Field
          id={`${prefix}-labelEn`}
          label={t('payments.labelEn')}
          name="labelEn"
          dir="ltr"
          required
          minLength={2}
          maxLength={60}
          defaultValue={config.labelEn}
        />
        <Field
          id={`${prefix}-accountName`}
          label={t('payments.accountName')}
          name="accountName"
          maxLength={120}
          defaultValue={config.accountName ?? ''}
        />
        <Field
          id={`${prefix}-accountNameEn`}
          label={t('payments.accountNameEn')}
          name="accountNameEn"
          dir="ltr"
          maxLength={120}
          defaultValue={config.accountNameEn ?? ''}
        />
        <Field
          id={`${prefix}-accountNumber`}
          label={t('payments.accountNumber')}
          name="accountNumber"
          dir="ltr"
          maxLength={60}
          defaultValue={config.accountNumber ?? ''}
        />
        <Field
          id={`${prefix}-order`}
          label={t('payments.order')}
          name="sortOrder"
          type="number"
          min={0}
          max={1000}
          dir="ltr"
          defaultValue={config.sortOrder}
        />
        <Field
          as="textarea"
          id={`${prefix}-instructionsAr`}
          label={t('payments.instructionsAr')}
          name="instructionsAr"
          rows={2}
          maxLength={500}
          defaultValue={config.instructionsAr ?? ''}
        />
        <Field
          as="textarea"
          id={`${prefix}-instructionsEn`}
          label={t('payments.instructionsEn')}
          name="instructionsEn"
          dir="ltr"
          rows={2}
          maxLength={500}
          defaultValue={config.instructionsEn ?? ''}
        />
      </div>
    </ActionForm>
  );
}

/** Give one campaign its own account for a method, or send it back to the default. */
export function OverrideForms({
  campaignId,
  slug,
  method,
  override,
}: {
  campaignId: string;
  slug: string;
  method: string;
  override?: CampaignAccountOverride;
}) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const prefix = `ov-${method}`;
  const hidden = (
    <>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="method" value={method} />
    </>
  );
  return (
    <div className="space-y-3">
      <ActionForm
        action={setCampaignOverrideAction}
        submitLabel={t('payments.saveOverride')}
        pendingLabel={tCommon('saving')}
        testId={`override-form-${method}`}
      >
        {hidden}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id={`${prefix}-name`}
            label={t('payments.accountName')}
            name="accountName"
            required
            minLength={2}
            maxLength={120}
            defaultValue={override?.accountName ?? ''}
          />
          <Field
            id={`${prefix}-number`}
            label={t('payments.accountNumber')}
            name="accountNumber"
            dir="ltr"
            required
            minLength={3}
            maxLength={60}
            defaultValue={override?.accountNumber ?? ''}
          />
          <div className="sm:col-span-2">
            <Field
              id={`${prefix}-note`}
              label={`${t('payments.note')} (${tCommon('optional')})`}
              name="note"
              minLength={2}
              maxLength={300}
              defaultValue={override?.note ?? ''}
            />
          </div>
        </div>
      </ActionForm>
      {override && (
        <ActionForm
          action={removeCampaignOverrideAction}
          submitLabel={t('payments.removeOverride')}
          pendingLabel={tCommon('saving')}
          variant="secondary"
          submitClassName="!px-3 !py-1.5 !text-sm"
          className="!space-y-2"
          testId={`override-remove-${method}`}
        >
          {hidden}
        </ActionForm>
      )}
    </div>
  );
}
