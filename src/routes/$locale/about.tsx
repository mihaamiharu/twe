import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FlaskConical,
  Github,
  Lightbulb,
  Linkedin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AboutHeroVisual } from '@/components/rebrand-visuals';
import {
  createPersonSchema,
  createProfilePageSchema,
  createSeoHead,
} from '@/lib/seo';
import { LocaleRoutes, localeParams } from '@/lib/navigation';
import i18n from '@/lib/i18n';

export const Route = createFileRoute('/$locale/about')({
  component: AboutPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('about:seo.title', { lng: locale }),
      description: i18n.t('about:seo.description', { lng: locale }),
      path: '/about',
      locale,
      jsonLd: [
        createProfilePageSchema({
          locale,
          title: i18n.t('about:seo.title', { lng: locale }),
          description: i18n.t('about:seo.description', { lng: locale }),
        }),
        createPersonSchema({
          description: i18n.t('about:seo.description', { lng: locale }),
        }),
      ],
    });
  },
});

const routeApi = getRouteApi('/$locale/about');

function AboutPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('about');
  const params = localeParams(locale);

  const productItems = [
    { key: 'learn', icon: BookOpen },
    { key: 'practice', icon: Code2 },
    { key: 'labs', icon: FlaskConical },
  ] as const;

  return (
    <div className="overflow-hidden bg-[var(--warm-canvas)] text-[var(--graphite)]">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-20">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('hero.eyebrow')}</p>
          <h1 className="mt-5 text-[clamp(2.8rem,6vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            {t('hero.title')}<span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-6 max-w-lg text-xl leading-8 text-[var(--graphite)]">{t('hero.subtitle')}</p>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted-graphite)]">{t('hero.description')}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <SocialLink href="https://www.linkedin.com/in/ekkisyamsugiardi/" label={t('hero.linkedin')} icon={<Linkedin className="h-4 w-4" aria-hidden="true" />} />
            <SocialLink href="https://github.com/mihaamiharu" label={t('hero.github')} icon={<Github className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </div>
        <AboutHeroVisual />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="grid items-center gap-10 rounded-xl bg-[var(--orange-tint)]/55 p-7 sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:p-14">
          <div className="relative mx-auto min-h-[250px] w-full max-w-[380px]">
            <div className="absolute left-[8%] top-[22%] h-28 w-28 rounded-full border border-[var(--brand-orange)]/35 bg-[var(--paper-surface)] p-8">
              <Lightbulb className="h-full w-full text-[var(--brand-orange)]" strokeWidth={1.3} aria-hidden="true" />
            </div>
            <div className="absolute bottom-[6%] right-0 w-[68%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] text-[var(--muted-graphite)]"><Code2 className="h-3.5 w-3.5 text-[var(--brand-orange)]" aria-hidden="true" /> thinking-through-the-test.ts</div>
              <div className="space-y-2 font-mono text-[11px] text-[var(--graphite)]">
                <div><span className="text-[var(--muted-graphite)]">01 </span>understand(system)</div>
                <div><span className="text-[var(--muted-graphite)]">02 </span>practice(concept)</div>
                <div><span className="text-[var(--muted-graphite)]">03 </span>review(result)</div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[var(--soft-border)] pt-3 font-mono text-[10px] text-[var(--brand-orange)]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> learning by doing</div>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('why.eyebrow')}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('why.title')}</h2>
            <p className="mt-5 text-xl font-medium leading-8 text-[var(--graphite)]">{t('why.quote')}</p>
            <p className="mt-5 text-base leading-7 text-[var(--muted-graphite)]">{t('why.paragraph1')}</p>
            <p className="mt-4 text-base leading-7 text-[var(--muted-graphite)]">{t('why.paragraph2')}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-12 lg:pb-28">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('background.eyebrow')}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('background.title')}</h2>
        </div>
        <div className="max-w-2xl text-base leading-7 text-[var(--muted-graphite)]">
          <p>{t('background.paragraph1')}</p>
          <p className="mt-5">{t('background.paragraph2')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-7 sm:p-10 lg:p-12">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t('find.title')}</h2>
          <div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-0">
            {productItems.map(({ key, icon: Icon }, index) => (
              <div key={key} className="flex gap-4 border-[var(--soft-border)] md:px-8 md:first:pl-0 md:last:pr-0 md:not-first:border-l">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-[var(--brand-orange)]" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted-graphite)]">0{index + 1}</div>
                  <h3 className="mt-2 text-xl font-semibold">{t(`find.${key}.title`)}</h3>
                  <p className="mt-2 text-base leading-7 text-[var(--muted-graphite)]">{t(`find.${key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12 lg:pb-32">
        <div className="flex flex-col gap-7 rounded-xl bg-[var(--graphite)] px-7 py-10 text-[var(--paper-surface)] sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">{t('contact.title')}</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[#d2d0c9]">{t('contact.description')}</p>
          </div>
          <Link to={LocaleRoutes.contact} params={params} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--brand-orange)] px-5 text-[15px] font-medium text-white hover:bg-[#f06f4b]">
            {t('contact.cta')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3.5 text-sm font-medium text-[var(--graphite)] transition-colors hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]">
      {icon}
      {label}
    </a>
  );
}
