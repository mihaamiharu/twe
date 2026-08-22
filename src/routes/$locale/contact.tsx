import { useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Loader2,
  MessageCircle,
  Send,
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
      description: 'Contact Ekki about QA mentoring, partnerships, sponsorships, or questions about TestingWithEkki.',
      path: '/contact',
      locale,
    });
  },
});

const topicOptions = ['general', 'mentoring', 'partnership', 'other'] as const;

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
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:px-12 lg:pb-20 lg:pt-20">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--brand-orange)]">{t('hero.eyebrow')}</p>
          <h1 className="mt-5 text-[clamp(3rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
            {t('hero.title')}<span className="text-[var(--brand-orange)]">.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[var(--muted-graphite)]">{t('hero.description')}</p>
        </div>
        <ContactHeroVisual />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="space-y-4">
          <ContactOption
            number="01"
            icon={<MessageCircle className="h-7 w-7" aria-hidden="true" />}
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
            cta={t('partnerships.cta')}
            href="mailto:ekki@testingwithekki.com?subject=Partnership%20with%20TestingWithEkki"
          />
        </div>

        <div id="message-form" className="mt-4 grid gap-8 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-6 sm:p-9 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12 lg:p-10">
          <div className="border-b border-[var(--soft-border)] pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--brand-orange)]">03</span>
              <Send className="h-5 w-5 text-[var(--brand-orange)]" aria-hidden="true" />
            </div>
            <p className="mt-7 font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand-orange)]">{t('form.eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t('form.title')}</h2>
            <p className="mt-3 max-w-sm text-base leading-7 text-[var(--muted-graphite)]">{t('form.description')}</p>
          </div>

          {isSuccess ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-12 w-12 text-[var(--brand-success)]" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold">{t('form.successTitle')}</h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[var(--muted-graphite)]">{t('form.successMessage')}</p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setIsSuccess(false)}>{t('form.sendAnother')}</Button>
            </div>
          ) : (
            <form onSubmit={(event) => { void handleSubmit(event); }} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">{t('form.name')}</Label>
                <Input id="contact-name" name="name" placeholder={t('form.namePlaceholder')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">{t('form.email')}</Label>
                <Input id="contact-email" name="email" type="email" placeholder={t('form.emailPlaceholder')} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-topic">{t('form.topic')}</Label>
                <select id="contact-topic" name="topic" defaultValue="" required className="flex h-11 w-full rounded-lg border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 text-[15px] text-[var(--graphite)] outline-none transition-colors focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20">
                  <option value="" disabled>{t('form.topicPlaceholder')}</option>
                  {topicOptions.map((topic) => <option key={topic} value={topic}>{t(`form.topics.${topic}`)}</option>)}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-message">{t('form.message')}</Label>
                <Textarea id="contact-message" name="message" placeholder={t('form.messagePlaceholder')} required minLength={10} className="min-h-36 resize-y" />
              </div>
              <div className="sm:col-span-2 sm:flex sm:justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {isSubmitting ? t('form.sending') : t('form.submit')}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
              <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function ContactOption({ number, icon, title, description, cta, href }: { number: string; icon: React.ReactNode; title: string; description: string; cta: string; href: string }) {
  return (
    <div className="grid gap-5 rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-7 sm:p-7">
      <div className="flex items-center gap-4 sm:block">
        <span className="font-mono text-xs text-[var(--brand-orange)]">{number}</span>
        <div className="mt-0 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--brand-orange)]/35 bg-[var(--orange-tint)] text-[var(--brand-orange)] sm:mt-4">{icon}</div>
      </div>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--muted-graphite)]">{description}</p>
      </div>
      <Button asChild className="w-full sm:w-auto">
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </Button>
    </div>
  );
}
