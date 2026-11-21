import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarLattice } from '@/components/ui/StarLattice';

interface Step {
  title: string;
  body: string;
}

/** Placeholder home: the hero and the path of a donation. The real case list arrives in P05. */
export default async function HomePage() {
  const t = await getTranslations('home');
  const steps = t.raw('steps') as Step[];

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium text-accent">{t('kicker')}</p>
          <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg text-muted">{t('heroBody')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#cases" className={buttonClasses('primary', 'lg')}>
              {t('ctaCases')}
            </Link>
          </div>
        </div>

        {/* The brand panel: the four real steps money takes, on the star lattice. */}
        <div className="relative isolate overflow-hidden rounded-[28px] bg-panel p-7 text-panel-ink shadow-lift sm:p-9">
          <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
          <h2 className="font-display text-xl font-bold text-white">{t('stepsTitle')}</h2>
          <ol className="relative mt-7 space-y-6">
            <span
              aria-hidden="true"
              className="absolute bottom-3 start-[15px] top-3 w-px bg-white/20"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4">
                <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-panel font-display text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">{step.title}</p>
                  <p className="mt-0.5 text-sm text-panel-ink/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="cases" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <EmptyState icon="heart" message={t('casesSoon')} />
      </section>
    </>
  );
}
