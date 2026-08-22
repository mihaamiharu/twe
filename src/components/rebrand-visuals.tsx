import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  Mail,
  MessageCircle,
  Play,
  Send,
  Terminal,
} from 'lucide-react';
import {
  QaAnnotation,
  QaDoodle,
  QaEngineerIllustration,
} from '@/components/qa-illustrations';
import { cn } from '@/lib/utils';

export {
  QaAnnotation,
  QaDoodle,
  QaEngineerIllustration,
} from '@/components/qa-illustrations';

function BrowserChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--soft-border)] px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-[#c74b42]" />
      <span className="h-2 w-2 rounded-full bg-[#b78327]" />
      <span className="h-2 w-2 rounded-full bg-[#23856d]" />
      <span className="ml-2 truncate font-mono text-[10px] text-[var(--muted-graphite)]">
        {title}
      </span>
    </div>
  );
}

export function PracticePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] border border-[#393c38] bg-[#171918] text-[#f2f1ec] shadow-[0_18px_45px_rgba(29,29,27,0.18)]',
        className,
      )}
      aria-label="Practice workspace preview"
    >
      <div className="flex items-center justify-between border-b border-[#393c38] px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#a5a69f]">
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          TWE PRACTICE
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#23856d] text-[#f2f1ec]">
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
          </span>
          <span className="font-mono text-[10px] text-[#a5a69f]">RUN</span>
        </div>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-[#393c38] bg-[#202321] p-3">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a5a69f]">
            Target / Browser
          </div>
          <div className="rounded-md bg-[#f2f1ec] p-3 text-[#1d1d1b]">
            <div className="mb-3 h-2 w-16 rounded bg-[#d9d3c8]" />
            <div className="space-y-2">
              <div className="h-7 rounded border border-[#d9d3c8] bg-white" />
              <div className="h-7 rounded border border-[#d9d3c8] bg-white" />
              <div className="flex h-7 items-center justify-center rounded bg-[#23856d] font-mono text-[10px] text-white">
                Sign in
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[#a5a69f]">
            <Eye className="h-3 w-3 text-[#e65f3a]" aria-hidden="true" />
            inspected
          </div>
        </div>

        <div className="rounded-md border border-[#393c38] bg-[#202321] p-3">
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-[#a5a69f]">
            <span>tests/login.spec.ts</span>
            <span>01 / 03</span>
          </div>
          <pre className="overflow-hidden font-mono text-[10px] leading-5 text-[#f2f1ec]">
            <code>
              <span className="text-[#a5a69f]">1 </span>
              <span className="text-[#e65f3a]">await</span> page.getByRole(
              {'\n'}
              <span className="text-[#a5a69f]">2 </span>
              {'  '}&#123; name:{' '}
              <span className="text-[#b78327]">'Sign in'</span> &#125; ).click()
              {'\n'}
              <span className="text-[#a5a69f]">3 </span>
              <span className="text-[#e65f3a]">await</span>{' '}
              expect(page.getByText(
              {'\n'}
              <span className="text-[#a5a69f]">4 </span>
              {'  '}
              <span className="text-[#b78327]">'Dashboard'</span>
              )).toBeVisible()
            </code>
          </pre>
          <div className="mt-3 border-t border-[#393c38] pt-3">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-[#23856d]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                test passed
              </span>
              <span className="text-[#a5a69f]">12.4s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeHeroVisual() {
  return (
    <div className="relative mx-auto min-h-[700px] w-full max-w-[590px] sm:min-h-[430px] lg:min-h-[520px]">
      <div className="absolute left-[4%] top-[9%] hidden w-[48%] rotate-[-3deg] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 shadow-[0_12px_35px_rgba(29,29,27,0.08)] sm:block">
        <BrowserChrome title="example.test / sign-in" />
        <div className="space-y-3 p-4">
          <div className="h-3 w-20 rounded bg-[var(--soft-border)]" />
          <div className="h-8 rounded border border-[var(--soft-border)] bg-white" />
          <div className="h-8 rounded border border-[var(--soft-border)] bg-white" />
          <div className="flex h-8 items-center justify-center rounded-md bg-[var(--brand-orange)] font-mono text-[10px] text-white">
            Sign in
          </div>
        </div>
        <div className="absolute -bottom-8 -right-5">
          <QaAnnotation step="inspect" />
        </div>
      </div>

      <div className="absolute right-0 top-[2%] z-10 w-[94%] sm:top-[20%] sm:w-[60%]">
        <PracticePreview />
        <div className="absolute -left-7 top-12 hidden sm:flex">
          <QaAnnotation step="execute" />
        </div>
      </div>

      <div className="absolute bottom-0 -left-[18%] z-[12] w-[125%] sm:bottom-[2%] sm:-left-[22%] sm:z-[4] sm:w-[88%] sm:min-w-[330px]">
        <QaEngineerIllustration />
      </div>

      <div className="absolute bottom-[2%] left-[10%] hidden w-[55%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)] sm:block">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-[var(--muted-graphite)]">
          <span>EXPECTED → ACTUAL</span>
          <Check
            className="h-4 w-4 text-[var(--brand-success)]"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted-graphite)]">Expected</span>
            <span className="text-[var(--brand-success)]">Dashboard</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[var(--muted-graphite)]">Actual</span>
            <span className="text-[var(--brand-success)]">Dashboard</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[var(--soft-border)] pt-3 font-mono text-[11px] text-[var(--brand-success)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          PASSED
        </div>
        <div className="absolute -bottom-8 -right-8 hidden sm:flex">
          <QaAnnotation step="verify" arrow="after" direction="down" />
        </div>
      </div>

      <div className="absolute right-[3%] top-[4%] hidden opacity-75 sm:block">
        <QaDoodle kind="trace" className="h-12 w-12" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 -z-10 h-36 rounded-[45%] bg-[var(--orange-tint)]/60 blur-2xl" />
    </div>
  );
}

export function LearnHeroVisual({
  className,
  labels = {
    inspect: 'INSPECT',
    execute: 'EXECUTE',
    verify: 'VERIFY',
    target: 'DOM target',
    artifact: 'Playwright artifact',
    result: 'Assertion passed',
  },
}: {
  className?: string;
  labels?: {
    inspect: string;
    execute: string;
    verify: string;
    target: string;
    artifact: string;
    result: string;
  };
}) {
  return (
    <div
      className={cn(
        'relative mx-auto min-h-[230px] w-full max-w-[560px] sm:min-h-[390px]',
        className,
      )}
    >
      <div className="absolute left-0 top-3 z-20 rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 py-2 font-mono text-[10px] text-[var(--brand-orange)] sm:left-[2%] sm:top-[5%] sm:px-4 sm:py-3 sm:text-[11px]">
        <span className="block text-[9px] text-[var(--muted-graphite)] sm:text-[10px]">
          01 /
        </span>
        {labels.inspect}
        <div className="mt-2 flex items-center gap-2 border-t border-[var(--soft-border)] pt-2 text-[var(--graphite)]">
          <QaDoodle kind="magnifier" className="h-5 w-5" />
          <span>{labels.target}</span>
        </div>
      </div>

      <div className="absolute right-0 top-[21%] z-20 rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 py-2 font-mono text-[10px] text-[var(--brand-orange)] sm:right-[1%] sm:top-[24%] sm:px-4 sm:py-3 sm:text-[11px]">
        <span className="block text-[9px] text-[var(--muted-graphite)] sm:text-[10px]">
          02 /
        </span>
        {labels.execute}
        <div className="mt-2 flex items-center gap-2 border-t border-[var(--soft-border)] pt-2 text-[var(--graphite)]">
          <Code2
            className="h-4 w-4 text-[var(--brand-orange)]"
            aria-hidden="true"
          />
          <span>{labels.artifact}</span>
        </div>
      </div>

      <div className="absolute bottom-[2%] left-[5%] z-20 rounded-md border border-[var(--brand-success)]/35 bg-[var(--paper-surface)] px-3 py-2 font-mono text-[10px] text-[var(--brand-success)] sm:left-[9%] sm:px-4 sm:py-3 sm:text-[11px]">
        <span className="block text-[9px] text-[var(--muted-graphite)] sm:text-[10px]">
          03 /
        </span>
        {labels.verify}
        <div className="mt-2 flex items-center gap-2 border-t border-[var(--soft-border)] pt-2">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{labels.result}</span>
        </div>
      </div>

      <div className="absolute inset-x-[10%] bottom-0 h-[38%] rounded-[45%] bg-[var(--orange-tint)]/60" />
      <div className="absolute bottom-0 left-[16%] z-10 w-[74%] sm:left-[18%] sm:w-[68%]">
        <QaEngineerIllustration />
      </div>
    </div>
  );
}

export function AboutHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-6">
      <div className="absolute inset-x-[12%] top-[8%] h-[84%] rounded-[42%] bg-[var(--orange-tint)]/70" />
      <img
        src="/me.jpg"
        alt="Ekki wearing glasses and a blue shirt"
        className="relative mx-auto block aspect-[4/4.5] w-[72%] rounded-[42%] object-cover object-top shadow-[0_20px_45px_rgba(29,29,27,0.12)]"
        width={1200}
        height={1600}
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute left-0 top-[18%] rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 py-2 font-mono text-[11px] text-[var(--brand-orange)] shadow-sm">
        01 / INSPECT
      </div>
      <div className="absolute right-0 top-[34%] rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 py-2 font-mono text-[11px] text-[var(--graphite)] shadow-sm">
        <Code2
          className="mr-2 inline h-3.5 w-3.5 text-[var(--brand-orange)]"
          aria-hidden="true"
        />
        AUTOMATION
      </div>
      <div className="absolute right-[7%] top-[7%] hidden sm:block">
        <QaDoodle kind="magnifier" className="h-12 w-12" />
      </div>
      <div className="absolute bottom-[6%] right-[4%] rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] px-3 py-2 font-mono text-[11px] text-[var(--graphite)] shadow-sm">
        02 / MENTORING
      </div>
    </div>
  );
}

export function ContactHeroVisual() {
  return (
    <div className="relative mx-auto min-h-[340px] w-full max-w-[560px]">
      <div className="absolute left-[8%] top-[12%] h-28 w-28 rounded-full border border-[var(--soft-border)] bg-[var(--paper-surface)] p-7 shadow-sm">
        <MessageCircle
          className="h-full w-full text-[var(--graphite)]"
          strokeWidth={1.4}
          aria-hidden="true"
        />
      </div>
      <div className="absolute right-[4%] top-[4%] w-[58%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)]">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--soft-border)] pb-3 font-mono text-[10px] text-[var(--muted-graphite)]">
          <span>CONTACT / TWE</span>
          <Mail
            className="h-4 w-4 text-[var(--brand-orange)]"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-3">
          {['Mentoring', 'Partnerships', 'General message'].map(
            (item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 font-mono text-[11px]"
              >
                <span className="text-[var(--brand-orange)]">0{index + 1}</span>
                <span className="h-px flex-1 bg-[var(--soft-border)]" />
                <span className="text-[var(--graphite)]">{item}</span>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="absolute bottom-[7%] left-[18%] w-[58%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-orange)]/40 bg-[var(--orange-tint)] text-[var(--brand-orange)]">
            <Send className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-[var(--graphite)]">
              Choose a topic
            </div>
            <div className="font-mono text-[10px] text-[var(--muted-graphite)]">
              MESSAGE → RESPONSE
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[4%] right-[5%] hidden rounded-md border border-[var(--brand-orange)]/40 bg-[var(--paper-surface)] px-3 py-2 font-mono text-[11px] text-[var(--brand-orange)] sm:block">
        LET&apos;S TALK{' '}
        <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="absolute bottom-[11%] left-[2%] hidden items-center gap-2 sm:flex">
        <QaDoodle kind="trace" className="h-10 w-10 opacity-75" />
        <span className="font-mono text-[10px] text-[var(--brand-orange)]">
          REVIEW / RESPONSE
        </span>
      </div>
    </div>
  );
}
