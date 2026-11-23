import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { requireWorkspace } from '@/lib/auth';
import { ImportWizard } from './ImportWizard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('imports');
  return { title: t('title') };
}

/** STAFF/ADMIN: import beneficiaries from Excel/CSV (FR-26). */
export default async function ImportsPage() {
  const { allowed } = await requireWorkspace('imports');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('imports');
  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="imports-page">
      <div className="max-w-3xl">
        <ImportWizard />
      </div>
    </WorkspacePage>
  );
}
