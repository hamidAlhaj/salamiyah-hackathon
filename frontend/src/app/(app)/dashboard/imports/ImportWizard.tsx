'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { buttonClasses } from '@/components/ui/Button';
import { Field, controlClass } from '@/components/ui/Field';
import { FormError } from '@/components/ui/FormParts';
import {
  commitImportAction,
  previewImportAction,
  validateImportAction,
} from '@/lib/actions/imports';
import type { ImportPreview, ImportValidation } from '@/lib/types/staff';
import { useToast } from '@/context/ToastContext';

/** Three steps: upload → match columns → dry run, then save the valid rows. */
export function ImportWizard() {
  const t = useTranslations('imports');
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [error, setError] = useState<string | undefined>();

  const upload = (form: FormData) =>
    startTransition(async () => {
      setError(undefined);
      setValidation(null);
      const res = await previewImportAction(form);
      if (res.error !== undefined) return setError(res.error);
      setPreview(res.data);
      setMapping(res.data.suggestedMapping);
    });

  const validate = () =>
    preview &&
    startTransition(async () => {
      setError(undefined);
      const res = await validateImportAction(preview.jobId, mapping);
      if (res.error !== undefined) return setError(res.error);
      setValidation(res.data);
    });

  const commit = () =>
    preview &&
    startTransition(async () => {
      setError(undefined);
      const res = await commitImportAction(preview.jobId);
      if (res.error !== undefined) return setError(res.error);
      toast.success(t('done', res.data));
      setPreview(null);
      setValidation(null);
    });

  const step = 'rounded-2xl border border-border bg-surface p-6 shadow-card';
  return (
    <div className="space-y-5">
      <FormError message={error} />
      <form action={upload} className={step}>
        <h2 className="font-display font-bold">1. {t('step1')}</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <Field label={t('file')} name="file" type="file" required accept=".xlsx,.csv" />
          </div>
          <button type="submit" disabled={pending} className={buttonClasses('primary')}>
            {t('upload')}
          </button>
        </div>
      </form>

      {preview && (
        <section className={step}>
          <h2 className="font-display font-bold">
            2. {t('step2')} — <span dir="ltr">{preview.fileName}</span> ({preview.totalRows})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {preview.fields.map((field) => (
              <label key={field} className="block space-y-1.5 text-sm font-medium">
                {t(`fields.${field}`)}
                <select
                  className={controlClass}
                  value={mapping[field] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                >
                  <option value="">{t('skip')}</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted">{t('sample')}</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="border-b border-border p-1 text-start">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border-b border-border p-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <button
            type="button"
            onClick={validate}
            disabled={pending || !mapping.fullName}
            className={buttonClasses('secondary', 'md', 'mt-4')}
          >
            {t('validate')}
          </button>
        </section>
      )}

      {preview && validation && (
        <section className={step}>
          <h2 className="font-display font-bold">3. {t('step3')}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
            {(
              [
                ['total', validation.totalRows],
                ['valid', validation.validRows],
                ['errors', validation.errorRows],
                ['duplicates', validation.duplicateRows],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface-muted p-3">
                <dt className="text-muted">{t(k)}</dt>
                <dd className="text-lg font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {validation.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted">
                    <th className="p-1 text-start">{t('row')}</th>
                    <th className="p-1 text-start">{t('field')}</th>
                    <th className="p-1 text-start">{t('message')}</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.errors.slice(0, 20).map((e, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-1 tabular-nums">{e.row}</td>
                      <td className="p-1">{e.field}</td>
                      <td className="p-1">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a
                href={`/api/files/import-errors/${validation.jobId}`}
                className="text-sm text-accent underline"
              >
                {t('downloadErrors')}
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={commit}
            disabled={pending || validation.validRows === 0}
            className={buttonClasses('primary', 'md', 'mt-4')}
          >
            {t('commit', { count: validation.validRows })}
          </button>
        </section>
      )}
    </div>
  );
}
