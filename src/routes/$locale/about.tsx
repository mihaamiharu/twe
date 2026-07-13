import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Code2,
  Database,
  Globe,
  Github,
  Linkedin,
  Mail,
  MapPinned,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CTAButton,
  PageContainer,
  PaperSurface,
  SectionHeading,
  StatPill,
} from '@/components/cozy-quest';
import { createSeoHead } from '@/lib/seo';

interface Milestone {
  year: string;
  title: string;
  description: string | string[];
}

interface ExpertiseGroup {
  name: string;
  items: string[];
}

interface ImpactItem {
  value: string;
  label: string;
}

export const Route = createFileRoute('/$locale/about')({
  component: AboutPage,
  head: ({ params }) =>
    createSeoHead({
      title: 'About Ekki Syam Sugiardi | TestingWithEkki',
      description:
        'Meet Ekki Syam Sugiardi, the QA Engineer behind TestingWithEkki. A portfolio project demonstrating full-stack engineering skills.',
      path: '/about',
      locale: params.locale || 'en',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: 'Ekki Syam Sugiardi',
            jobTitle: 'QA Engineer',
            url: 'https://testingwithekki.com',
            sameAs: [
              'https://www.linkedin.com/in/ekkisyamsugiardi',
              'https://github.com/mihaamiharu',
            ],
          },
        },
      ],
    }),
});

function AboutPage() {
  const { t } = useTranslation(['about', 'common']);
  const { locale } = useParams({ from: '/$locale/about' });
  const milestones = t('milestones.items', {
    returnObjects: true,
  }) as Milestone[];
  const impacts = t('impact.items', { returnObjects: true }) as ImpactItem[];
  const [project, ...career] = milestones;
  const expertise = [
    { key: 'automation', icon: Globe },
    { key: 'backend', icon: Database },
    { key: 'strategy', icon: Brain },
    { key: 'devops', icon: Code2 },
  ] as const;

  return (
    <main className="min-h-screen py-8 sm:py-10 lg:py-12">
      <PageContainer width="wide">
        <PaperSurface className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-64 rounded-full border-[22px] border-accent/30"
          />
          <div className="relative grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-center">
            <img
              src="/me.small.jpg"
              alt="Ekki Syam Sugiardi"
              className="mx-auto size-32 rounded-[2rem] border-4 border-background object-cover shadow-[0_16px_36px_rgba(73,62,45,0.16)] lg:size-44"
              width={176}
              height={176}
              fetchPriority="high"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {t('hero.eyebrow')}
              </p>
              <h1
                className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
                dangerouslySetInnerHTML={{ __html: t('hero.title') }}
              />
              <p className="mt-3 text-lg font-semibold text-primary">
                {t('hero.subtitle')}
              </p>
              <p
                className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base"
                dangerouslySetInnerHTML={{ __html: t('hero.description') }}
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <CTAButton asChild>
                  <a
                    href="https://www.linkedin.com/in/ekkisyamsugiardi/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="size-4" aria-hidden="true" />
                    {t('hero.connect')}
                  </a>
                </CTAButton>
                <Button variant="outline" size="lg" asChild>
                  <a
                    href="https://github.com/mihaamiharu"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="size-4" aria-hidden="true" />
                    {t('hero.github')}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </PaperSurface>

        <section
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label={t('impact.title')}
        >
          {impacts.map((impact) => (
            <StatPill
              key={impact.label}
              value={impact.value}
              label={impact.label}
            />
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <PaperSurface className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Code2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {t('philosophy.eyebrow')}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  {t('philosophy.title')}
                </h2>
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
              <p dangerouslySetInnerHTML={{ __html: t('philosophy.intro') }} />
              <p>{t('philosophy.listIntro')}</p>
              <ul className="space-y-3">
                {(
                  ['integration', 'shiftLeft', 'agility', 'multiplier'] as const
                ).map((key) => (
                  <li key={key} className="flex gap-3">
                    <Sparkles
                      className="mt-1 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t(`philosophy.list.${key}`),
                      }}
                    />
                  </li>
                ))}
              </ul>
              <p>{t('philosophy.conclusion')}</p>
            </div>
          </PaperSurface>

          {project && (
            <PaperSurface className="p-6 sm:p-8" texture={false}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--quest-gold)]/15 text-foreground">
                <MapPinned className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {t('project.eyebrow')}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {project.title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {(Array.isArray(project.description)
                  ? project.description
                  : [project.description]
                ).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              <Button className="mt-6 w-full" variant="outline" asChild>
                <Link to="/$locale/tutorials" params={{ locale }}>
                  {t('project.cta')}{' '}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </PaperSurface>
          )}
        </section>

        <section className="mt-12" aria-label={t('milestones.title')}>
          <SectionHeading
            as="h2"
            eyebrow={t('milestones.eyebrow')}
            title={t('milestones.title')}
            description={t('milestones.subtitle')}
          />
          <ol className="relative mx-auto mt-8 max-w-5xl space-y-5 border-l border-border pl-6 sm:pl-8">
            {career.map((milestone) => (
              <li
                key={`${milestone.year}-${milestone.title}`}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[2.1rem] top-6 size-4 rounded-full border-4 border-background bg-primary sm:-left-[2.6rem]"
                />
                <PaperSurface className="p-5 sm:p-6" texture={false}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{milestone.year}</Badge>
                    <h3 className="font-display text-xl font-semibold">
                      {milestone.title}
                    </h3>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    {Array.isArray(milestone.description) ? (
                      <ul className="space-y-2">
                        {milestone.description.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{milestone.description}</p>
                    )}
                  </div>
                </PaperSurface>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12" aria-label={t('expertise.title')}>
          <SectionHeading
            as="h2"
            eyebrow={t('expertise.eyebrow')}
            title={t('expertise.title')}
            description={t('expertise.subtitle')}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {expertise.map(({ key, icon: Icon }) => {
              const groups = t(`expertise.${key}.groups`, {
                returnObjects: true,
              }) as ExpertiseGroup[];
              return (
                <PaperSurface key={key} className="p-6" texture={false}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl font-semibold">
                      {t(`expertise.${key}.title`)}
                    </h3>
                  </div>
                  <div className="mt-5 space-y-5">
                    {groups.map((group) => (
                      <div key={group.name}>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {group.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PaperSurface>
              );
            })}
          </div>
        </section>

        <PaperSurface className="mt-12 px-6 py-10 text-center sm:px-10" texture>
          <BriefcaseBusiness
            className="mx-auto size-8 text-primary"
            aria-hidden="true"
          />
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-2xl font-semibold sm:text-3xl">
            {t('contact.title')}
          </h2>
          <CTAButton asChild className="mt-6">
            <Link to="/$locale/contact" params={{ locale }}>
              <Mail className="size-4" aria-hidden="true" />
              {t('contact.cta')}
            </Link>
          </CTAButton>
        </PaperSurface>
      </PageContainer>
    </main>
  );
}
