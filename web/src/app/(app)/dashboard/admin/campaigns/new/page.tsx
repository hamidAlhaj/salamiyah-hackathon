import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { searchBeneficiaries } from '@/lib/api/admin-beneficiaries';
import { listAllCategories } from '@/lib/api/admin-categories';
import { listPaymentMethods } from '@/lib/api/payment-methods';
import { requireWorkspace } from '@/lib/auth';
import { CreateCampaignForm } from './CreateCampaignForm';
import { NewBeneficiaryForm } from './NewBeneficiaryForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminCampaigns');
  return { title: t('newTitle') };
}

export default async function NewCampaignPage() {
  const { token, allowed } = await requireWorkspace('newCampaign');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminCampaigns');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const [categories, beneficiaries, methods] = await Promise.all([
    listAllCategories(token),
    searchBeneficiaries(token),
    listPaymentMethods(locale),
  ]);

  // Behaviour flags decide what is offered: never the category code.
  const options = categories
    .filter((c) => c.isActive && !c.requiresMedicalCase)
    .map((c) => ({
      id: c.id,
      name: locale === 'en' ? c.nameEn : c.nameAr,
      icon: c.icon,
      supportsMonthlySponsorship: c.supportsMonthlySponsorship,
    }));

  return (
    <WorkspacePage title={t('newTitle')} intro={t('newIntro')} testId="new-campaign-page">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <CreateCampaignForm
          categories={options}
          beneficiaries={beneficiaries.filter((b) => !b.isSuspended)}
          methods={methods
            .filter((m) => m.kind !== 'CASH')
            .map((m) => ({ method: m.method, label: m.label }))}
        />
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{t('newBeneficiary')}</h2>
            <div className="mt-4">
              <NewBeneficiaryForm />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
