'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field, controlClass, labelClass } from '@/components/ui/Field';
import { createCampaignAction, type CreateCampaignState } from '@/lib/actions/campaigns';
import type { StaffBeneficiary } from '@/lib/types/staff';
import { COVER_KEYS, CURRENCIES, PRIORITIES, type BeneficiaryKind } from '@/shared';

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  supportsMonthlySponsorship: boolean;
  /** The only beneficiary kind its campaigns link (the API refuses others); null = any. */
  beneficiaryKind: BeneficiaryKind | null;
}

export interface MethodOption {
  method: string;
  label: string;
}

/**
 * ADMIN creates a campaign. Only categories without requiresMedicalCase are offered (medical campaigns
 * come from case review). Monthly amounts appear only for categories that support sponsorship.
 */
export function CreateCampaignForm({
  categories,
  beneficiaries,
  methods,
}: {
  categories: CategoryOption[];
  beneficiaries: StaffBeneficiary[];
  methods: MethodOption[];
}) {
  const t = useTranslations('adminCampaigns');
  const tPriority = useTranslations('priority');
  const tKinds = useTranslations('campaign.kinds');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const category = categories.find((c) => c.id === categoryId);
  const monthly = category?.supportsMonthlySponsorship ?? false;
  const kind = category?.beneficiaryKind ?? null;
  // Only beneficiaries of the category's kind can be linked (orphans for sponsorship, …).
  const ofKind = useMemo(
    () => (kind ? beneficiaries.filter((b) => b.kind === kind) : beneficiaries),
    [beneficiaries, kind],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ofKind;
    return ofKind.filter((b) =>
      [b.publicCode, b.fullName, b.area ?? ''].some((v) => v.toLowerCase().includes(q)),
    );
  }, [ofKind, query]);

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    const next = categories.find((c) => c.id === id)?.beneficiaryKind ?? null;
    // A ticked beneficiary of another kind would be refused: untick it.
    setSelected((s) =>
      next ? s.filter((sid) => beneficiaries.find((b) => b.id === sid)?.kind === next) : s,
    );
  };

  if (categories.length === 0) {
    return (
      <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted">{t('noCategories')}</p>
    );
  }

  const onResult = (state: CreateCampaignState) => {
    if (state.ok && state.slug) {
      setCreatedSlug(state.slug);
      setSelected([]);
      setMethod('');
    }
  };

  return (
    <div className="space-y-4">
      {createdSlug && (
        <p className="rounded-xl border border-brand-200 bg-accent-soft px-4 py-3 text-sm dark:border-brand-800">
          <Link
            href={`/campaigns/${createdSlug}`}
            className="font-semibold text-accent-strong underline"
          >
            {t('openPublic')}: /campaigns/{createdSlug}
          </Link>
        </p>
      )}
      <ActionForm
        action={createCampaignAction}
        submitLabel={t('submit')}
        pendingLabel={t('submitting')}
        resetOnSuccess
        onResult={onResult}
        submitClassName="w-full sm:w-auto"
        testId="create-campaign-form"
      >
        <section className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <fieldset>
            <legend className={labelClass}>{t('category')}</legend>
            <p className="text-xs text-muted">{t('categoryHint')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
              {categories.map((c) => (
                <label key={c.id} className="cursor-pointer" data-category-option={c.name}>
                  <input
                    type="radio"
                    name="categoryId"
                    value={c.id}
                    checked={categoryId === c.id}
                    onChange={() => chooseCategory(c.id)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring dark:peer-checked:border-brand-700 dark:peer-checked:bg-brand-600">
                    <CategoryIcon icon={c.icon} className="h-4 w-4" />
                    {c.name}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('titleAr')} name="titleAr" required minLength={5} maxLength={160} />
            <Field label={t('titleEn')} name="titleEn" dir="ltr" minLength={5} maxLength={160} />
            <Field
              as="textarea"
              label={t('summaryAr')}
              name="summaryAr"
              required
              minLength={10}
              rows={4}
            />
            <Field
              as="textarea"
              label={t('summaryEn')}
              name="summaryEn"
              dir="ltr"
              minLength={10}
              rows={4}
            />
            <Field
              label={t('target')}
              name="targetAmount"
              required
              inputMode="decimal"
              dir="ltr"
              pattern="[0-9]+(\.[0-9]{1,2})?"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field as="select" label={t('currency')} name="currency" defaultValue="SYP">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Field>
              <Field as="select" label={t('priority')} name="priority" defaultValue="NORMAL">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {tPriority(p)}
                  </option>
                ))}
              </Field>
            </div>
            <Field label={t('area')} name="area" maxLength={60} />
            <div className="space-y-3 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isOngoing" className="h-4 w-4 accent-brand-600" />
                {t('ongoing')}
              </label>
              <fieldset className="flex flex-wrap gap-4 text-sm">
                <legend className="sr-only">{t('status')}</legend>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="ACTIVE"
                    defaultChecked
                    className="accent-brand-600"
                  />
                  {t('statusActive')}
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="status" value="DRAFT" className="accent-brand-600" />
                  {t('statusDraft')}
                </label>
              </fieldset>
            </div>
          </div>
          <fieldset>
            <legend className={labelClass}>{t('cover')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COVER_KEYS.map((key, i) => (
                <label key={key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="coverKey"
                    value={key}
                    defaultChecked={i === 0}
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
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">{t('beneficiaries')}</h2>
          <p className="text-xs text-muted">{t('beneficiariesHint')}</p>
          {kind && (
            <p
              className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent-strong"
              data-testid="beneficiary-kind-filter"
              data-kind={kind}
            >
              {t('beneficiariesOfKind', { kind: tKinds(kind) })}
            </p>
          )}
          {ofKind.length === 0 ? (
            <p className="text-sm text-muted">
              {kind
                ? t('beneficiariesNoneOfKind', { kind: tKinds(kind) })
                : t('beneficiariesEmpty')}
            </p>
          ) : (
            <>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchBeneficiaries')}
                aria-label={t('searchBeneficiaries')}
                className={controlClass}
              />
              <ul className="max-h-80 space-y-2 overflow-y-auto" data-testid="beneficiary-picker">
                {visible.map((b) => {
                  const checked = selected.includes(b.id);
                  return (
                    <li key={b.id} className="rounded-xl border border-border px-3 py-2">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          name="beneficiaryIds"
                          value={b.id}
                          checked={checked}
                          onChange={(e) =>
                            setSelected((s) =>
                              e.target.checked ? [...s, b.id] : s.filter((x) => x !== b.id),
                            )
                          }
                          className="h-4 w-4 accent-brand-600"
                          data-code={b.publicCode}
                        />
                        <span dir="ltr" className="font-display font-bold text-accent-strong">
                          {b.publicCode}
                        </span>
                        <span className="text-sm">{tKinds(b.kind)}</span>
                        <span className="truncate text-xs text-muted">
                          {b.fullName}
                          {b.area ? ` — ${b.area}` : ''}
                        </span>
                      </label>
                      {checked && monthly && (
                        <div className="mt-2 max-w-xs">
                          <Field
                            id={`monthly-${b.id}`}
                            label={t('monthlyAmount')}
                            name={`monthly_${b.id}`}
                            inputMode="decimal"
                            dir="ltr"
                            pattern="[0-9]+(\.[0-9]{1,2})?"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">{t('account')}</h2>
          <p className="text-xs text-muted">{t('accountHint')}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              as="select"
              label={t('accountMethod')}
              name="accountMethod"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="">{t('accountNone')}</option>
              {methods.map((m) => (
                <option key={m.method} value={m.method}>
                  {m.label}
                </option>
              ))}
            </Field>
            {method && (
              <>
                <Field
                  label={t('accountName')}
                  name="accountName"
                  required
                  minLength={2}
                  maxLength={120}
                />
                <Field
                  label={t('accountNumber')}
                  name="accountNumber"
                  dir="ltr"
                  required
                  minLength={3}
                  maxLength={60}
                />
              </>
            )}
          </div>
        </section>
      </ActionForm>
    </div>
  );
}
