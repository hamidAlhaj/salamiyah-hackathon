import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { requireWorkspace } from '@/lib/auth';
import { IntakeForm } from './IntakeForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('intake');
  return { title: t('title') };
}

/** STAFF/ADMIN: register a medical request at the local council (FR-06). */
export default async function IntakePage() {
  const { allowed } = await requireWorkspace('intake');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('intake');
  return (
    <WorkspacePage title={t('title')} testId="intake-page">
      <div className="max-w-2xl">
        <IntakeForm />
      </div>
    </WorkspacePage>
  );
}
