'use client';

import { useTranslations } from 'next-intl';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { ActionForm } from '@/components/forms/ActionForm';
import type { ButtonVariant } from '@/components/ui/Button';
import { Field, labelClass } from '@/components/ui/Field';
import {
  campaignLifecycleAction,
  postCampaignUpdateAction,
  updateCampaignAction,
} from '@/lib/actions/campaigns';
import type { StaffCampaignDetail } from '@/lib/types/staff';
import { COVER_KEYS, PRIORITIES } from '@/shared';

type Ids = { id: string; slug: string };

function Hidden({ id, slug }: Ids) {
  return (
    <>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
    </>
  );
}

/** One lifecycle move: a short explanation of its effect, then the button that does it. */
export function LifecycleButton({
  id,
  slug,
  op,
  label,
  hint,
  variant = 'primary',
}: Ids & {
  op: 'publish' | 'pause' | 'resume' | 'complete';
  label: string;
  hint: string;
  variant?: ButtonVariant;
}) {
  const tCommon = useTranslations('common');
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl bg-surface-muted p-4">
      <p className="text-sm text-muted">{hint}</p>
      <ActionForm
        action={campaignLifecycleAction}
        submitLabel={label}
        pendingLabel={tCommon('saving')}
        variant={variant}
        className="!space-y-2"
        testId={`lifecycle-${op}`}
      >
        <Hidden id={id} slug={slug} />
        <input type="hidden" name="op" value={op} />
      </ActionForm>
    </div>
  );
}

/** Closing is final and hides the campaign from public pages: it sits behind a disclosure. */
export function CloseCampaign({ id, slug }: Ids) {
  const t = useTranslations('adminCampaigns');
  const tCommon = useTranslations('common');
  return (
    <details className="group rounded-xl border border-border p-4" data-testid="lifecycle-close">
      <summary className="cursor-pointer text-sm font-semibold text-danger">
        {t('manage.close')}
      </summary>
      <p className="mt-2 text-sm text-muted">{t('manage.closeHint')}</p>
      <div className="mt-3">
        <ActionForm
          action={campaignLifecycleAction}
          submitLabel={t('manage.closeConfirm')}
          pendingLabel={tCommon('saving')}
          variant="danger"
          className="!space-y-2"
        >
          <Hidden id={id} slug={slug} />
          <input type="hidden" name="op" value="close" />
        </ActionForm>
      </div>
    </details>
  );
}

/** Titles, anonymised summaries, cover illustration, area and priority. */
export function EditCampaignForm({ campaign: c }: { campaign: StaffCampaignDetail }) {
  const t = useTranslations('adminCampaigns');
  const tPriority = useTranslations('priority');
  const clear = t('manage.clearHint');
  return (
    <ActionForm
      action={updateCampaignAction}
      submitLabel={t('manage.save')}
      pendingLabel={t('submitting')}
      testId="campaign-edit-form"
    >
      <Hidden id={c.id} slug={c.slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="edit-titleAr"
          label={t('titleAr')}
          name="titleAr"
          required
          minLength={5}
          maxLength={160}
          defaultValue={c.titleAr}
        />
        <Field
          id="edit-titleEn"
          label={t('titleEn')}
          name="titleEn"
          dir="ltr"
          maxLength={160}
          hint={clear}
          defaultValue={c.titleEn ?? ''}
        />
      </div>
      <Field
        as="textarea"
        id="edit-summaryAr"
        label={t('summaryAr')}
        name="summaryAr"
        required
        minLength={10}
        maxLength={4000}
        rows={5}
        defaultValue={c.summaryAr}
      />
      <Field
        as="textarea"
        id="edit-summaryEn"
        label={t('summaryEn')}
        name="summaryEn"
        dir="ltr"
        maxLength={4000}
        rows={4}
        hint={clear}
        defaultValue={c.summaryEn ?? ''}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="edit-area"
          label={t('area')}
          name="area"
          maxLength={60}
          hint={clear}
          defaultValue={c.area ?? ''}
        />
        <Field
          as="select"
          id="edit-priority"
          label={t('priority')}
          name="priority"
          defaultValue={c.priority}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {tPriority(p)}
            </option>
          ))}
        </Field>
      </div>
      <fieldset>
        <legend className={labelClass}>{t('cover')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COVER_KEYS.map((key) => (
            <label key={key} className="cursor-pointer" data-cover={key}>
              <input
                type="radio"
                name="coverKey"
                value={key}
                defaultChecked={key === (c.coverKey ?? COVER_KEYS[0])}
                className="peer sr-only"
              />
              <span className="block h-20 overflow-hidden rounded-xl border-2 border-transparent ring-1 ring-border peer-checked:border-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                <CampaignCover coverKey={key} />
              </span>
              <span className="sr-only">{key}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </ActionForm>
  );
}

/** A public update for the campaign page (Arabic required, English optional). */
export function PostUpdateForm({ id, slug }: Ids) {
  const t = useTranslations('adminCampaigns');
  const tCommon = useTranslations('common');
  return (
    <ActionForm
      action={postCampaignUpdateAction}
      submitLabel={t('manage.postUpdate')}
      pendingLabel={tCommon('saving')}
      resetOnSuccess
      testId="campaign-update-form"
    >
      <Hidden id={id} slug={slug} />
      <Field
        as="textarea"
        id="update-bodyAr"
        label={t('manage.updateAr')}
        name="bodyAr"
        required
        minLength={5}
        maxLength={2000}
        rows={3}
      />
      <Field
        as="textarea"
        id="update-bodyEn"
        label={`${t('manage.updateEn')} (${tCommon('optional')})`}
        name="bodyEn"
        dir="ltr"
        maxLength={2000}
        rows={2}
      />
    </ActionForm>
  );
}
