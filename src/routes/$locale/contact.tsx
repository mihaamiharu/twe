import { useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Loader2,
  Mail,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContactHeroVisual } from '@/components/rebrand-visuals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitContactMessage } from '@/server/contact.fn';
import { createSeoHead } from '@/lib/seo';
import { toast } from 'sonner';

export const Route = createFileRoute('/$locale/contact')({
  component: ContactPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Contact | TestingWithEkki',
      description: 'Contact Ekki about QA mentoring, partnerships, sponsorships, career opportunities, or questions about TestingWithEkki.',
      path: '/contact',
      locale,
    });
  },
});

const topicOptions = ['general', 'mentoring', 'partnership', 'opportunity', 'other'] as const;

function ContactPage() {
  const { t } = useTranslation('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const topic = formData.get('topic');
    const message = formData.get('message');

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof topic !== 'string' ||
      typeof message !== 'string'
    ) {
      toast.error(t('form.errorMessage'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await submitContactMessage({
        data: {
          name,
          email,
          topic: topic as (typeof topicOptions)[number],
          message,
        },
      });

      if (response.success) {
        setIsSuccess(true);
        toast.success(response.message);
      } else {
        toast.error(response.error || t('form.errorMessage'));
      }
    } catch {
      toast.error(t('form.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden bg-[var(--warm-canvas)] text-[var(--graphite)]">
      <section className="mx-auto grid max-w-[1348px] items-center gap-6 px-6 pb-5 pt-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:px-10 lg:pb-6 lg:pt-10">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('hero.eyebrow')}</p>
          <h1 className="mt-4 text-[clamp(3.5rem,6.5vw,5.25rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
            {t('hero.title')}<span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-5 max-w-[31rem] text-[1.08rem] leading-8 text-[var(--muted-graphite)]">{t('hero.description')}</p>
        </div>
        <ContactHeroVisual />
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-8 sm:px-8 lg:px-0 lg:pb-3">
        <div className="space-y-3">
          <ContactOption
            number="01"
            icon={
              <img
                src="/illustrations/twe-inspector-male-hero.png"
                alt=""
                className="absolute left-1/2 top-0 h-[230%] w-auto max-w-none -translate-x-1/2 object-contain object-top"
              />
            }
            title={t('mentoring.title')}
            description={t('mentoring.description')}
            cta={t('mentoring.cta')}
            href="https://calendar.app.google/CKy4ozvuwXQouzkJ6"
          />
          <ContactOption
            number="02"
            icon={<Handshake className="h-7 w-7" aria-hidden="true" />}
            title={t('partnerships.title')}
            description={t('partnerships.description')}
            note={t('partnerships.opportunityNote')}
            cta={t('partnerships.cta')}
            href="mailto:ekki@testingwithekki.com?subject=Partnership%20with%20TestingWithEkki"
            secondaryCta={t('partnerships.cvCta')}
            secondaryHref="/Ekki_Syam_CV.pdf"
          />
        </div>

        <div className="relative mt-3 lg:pl-16">
          <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--brand-orange)] font-mono text-xs font-medium text-[var(--brand-orange)]">03</span>
            <ArrowRight className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" />
          </div>

          <div id="message-form" className="grid gap-6 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 sm:p-5 lg:grid-cols-[0.68fr_1.32fr] lg:gap-8 lg:p-5">
          <div className="flex items-center gap-5 border-b border-[var(--soft-border)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--brand-orange)]/35 bg-[var(--orange-tint)] text-[var(--brand-orange)]">
              <Mail className="h-9 w-9" strokeWidth={1.4} aria-hidden="true" />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-3 sm:hidden">
                <span className="font-mono text-xs text-[var(--brand-orange)]">03</span>
                <span className="h-px w-8 bg-[var(--brand-orange)]/40" />
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t('form.title')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-graphite)]">{t('form.description')}</p>
            </div>
          </div>

          {isSuccess ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
              <CheckCircle2 className="h-12 w-12 text-[var(--brand-success)]" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold">{t('form.successTitle')}</h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[var(--muted-graphite)]">{t('form.successMessage')}</p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setIsSuccess(false)}>{t('form.sendAnother')}</Button>
            </div>
          ) : (
            <form onSubmit={(event) => { void handleSubmit(event); }} className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">{t('form.name')}</Label>
                <Input id="contact-name" name="name" placeholder={t('form.namePlaceholder')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">{t('form.email')}</Label>
                <Input id="contact-email" name="email" type="email" placeholder={t('form.emailPlaceholder')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-topic">{t('form.topic')}</Label>
                <select id="contact-topic" name="topic" defaultValue="" required className="flex h-10 w-full rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 text-sm text-[var(--graphite)] outline-none transition-colors focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20">
                  <option value="" disabled>{t('form.topicPlaceholder')}</option>
                  {topicOptions.map((topic) => <option key={topic} value={topic}>{t(`form.topics.${topic}`)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-start-2 sm:row-start-2">
                <Label htmlFor="contact-message">{t('form.message')}</Label>
                <Textarea id="contact-message" name="message" placeholder={t('form.messagePlaceholder')} required minLength={10} className="min-h-[4.5rem] resize-y" />
              </div>
              <div className="sm:col-start-2 sm:row-start-3 sm:flex sm:justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-[9.5rem]">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  {isSubmitting ? t('form.sending') : t('form.submit')}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
              <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            </form>
          )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactOption({ number, icon, title, description, note, cta, href, ctaVariant = 'default', secondaryCta, secondaryHref }: { number: string; icon: React.ReactNode; title: string; description: string; note?: string; cta: string; href: string; ctaVariant?: 'default' | 'link'; secondaryCta?: string; secondaryHref?: string }) {
  return (
    <div className="relative lg:pl-16">
      <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--brand-orange)] font-mono text-xs font-medium text-[var(--brand-orange)]">{number}</span>
        <ArrowRight className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" />
      </div>

      <div className="grid gap-5 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-5 sm:grid-cols-[96px_minmax(0,1fr)_1px_15rem] sm:items-center sm:gap-6 sm:p-6">
        <div className="flex items-center gap-3 sm:justify-center">
          <span className="font-mono text-xs text-[var(--brand-orange)] sm:hidden">{number}</span>
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--brand-orange)]/35 bg-[var(--orange-tint)] text-[var(--brand-orange)]">{icon}</div>
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2>
          <p className="mt-1.5 max-w-[34rem] text-sm leading-6 text-[var(--muted-graphite)]">{description}</p>
          {note && <p className="mt-1.5 text-sm font-medium text-[var(--brand-orange)]">{note}</p>}
        </div>
        <div className="hidden h-16 w-px bg-[var(--soft-border)] sm:block" />
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            asChild
            variant={ctaVariant}
            className={ctaVariant === 'link'
              ? 'h-auto w-full justify-start px-0 py-1 text-left text-[var(--brand-orange)] hover:bg-transparent hover:text-[var(--brand-orange)] hover:no-underline focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] sm:w-auto sm:justify-end'
              : 'w-full sm:w-auto'}
          >
            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
              {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          {secondaryCta && secondaryHref && (
            <a
              href={secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-sm font-medium text-[var(--brand-orange)] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] sm:justify-end"
            >
              {secondaryCta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
