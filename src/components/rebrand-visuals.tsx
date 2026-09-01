import {
  ArrowRight,
  Bug,
  CalendarDays,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  MessageCircle,
  Play,
  Terminal,
} from 'lucide-react';
import {
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

export function PracticePreview({
  className,
  compact = false,
  showWorkflowStep = false,
}: {
  className?: string;
  compact?: boolean;
  showWorkflowStep?: boolean;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] border border-[#393c38] bg-[#171918] text-[#f2f1ec] shadow-[0_18px_45px_rgba(29,29,27,0.18)]',
        className,
      )}
      aria-label="Practice workspace preview"
      data-practice-preview={compact ? 'compact' : 'full'}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b border-[#393c38] px-4 py-3',
          compact && 'px-3 py-2.5',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 whitespace-nowrap font-mono text-[11px] text-[#a5a69f]',
            compact && 'gap-1.5 text-[9px]',
          )}
        >
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          TWE PRACTICE
        </div>
        <div
          className={cn('flex items-center gap-2', compact && 'gap-1.5')}
          data-run-control={showWorkflowStep ? '02' : undefined}
        >
          {showWorkflowStep && (
            <span
              className="whitespace-nowrap font-mono text-[9px] tracking-[0.08em] text-[var(--brand-orange)]"
              data-workflow-label="run"
            >
              02 /
            </span>
          )}
          <span
            className="practice-run-indicator inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand-orange)] text-[#f2f1ec]"
            data-practice-motion="run"
          >
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
          </span>
          <span
            className={cn(
              'font-mono text-[10px] text-[#a5a69f]',
              showWorkflowStep && 'text-[var(--brand-orange)]',
            )}
          >
            RUN
          </span>
        </div>
      </div>

      {compact ? (
        <div className="p-3">
          <div className="rounded-md border border-[#393c38] bg-[#202321] p-3">
            <div className="mb-2 flex items-center gap-2 font-mono text-[9px] text-[#a5a69f]">
              <Code2
                className="h-3 w-3 text-[var(--brand-orange)]"
                aria-hidden="true"
              />
              tests/login.spec.ts
            </div>
            <div className="overflow-hidden whitespace-nowrap font-mono text-[9px] leading-4 text-[#f2f1ec]">
              <span className="text-[var(--brand-orange)]">await</span>{' '}
              page.getByRole(&apos;button&apos;, &#123; name: &apos;Sign
              in&apos; &#125;).click()
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#393c38] pt-2 font-mono text-[9px]">
              <span
                className="text-[var(--brand-orange)]"
                data-hero-step="verify"
                data-workflow-label="verify"
              >
                03 / VERIFY
              </span>
              <span
                className="flex items-center gap-1 text-[var(--brand-success)]"
                data-result-state="passed"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Dashboard · passed
              </span>
            </div>
          </div>
        </div>
      ) : (
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
                <div className="practice-target-button flex h-7 items-center justify-center rounded bg-[var(--brand-orange)] font-mono text-[10px] text-white">
                  Sign in
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[#a5a69f]">
              <Eye
                className="h-3 w-3 text-[var(--brand-orange)]"
                aria-hidden="true"
              />
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
                <span className="text-[var(--brand-orange)]">await</span>{' '}
                page.getByRole(
                {'\n'}
                <span className="text-[#a5a69f]">2 </span>
                {'  '}&#123; name:{' '}
                <span className="text-[#b78327]">'Sign in'</span> &#125;
                ).click()
                {'\n'}
                <span className="text-[#a5a69f]">3 </span>
                <span className="text-[var(--brand-orange)]">await</span>{' '}
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
                <span
                  className="practice-result-indicator flex items-center gap-1.5 text-[var(--brand-success)]"
                  data-practice-motion="verify"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  test passed
                </span>
                <span className="text-[#a5a69f]">12.4s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InspectTargetBrowser({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] shadow-[0_14px_38px_rgba(29,29,27,0.09)]',
        className,
      )}
      data-hero-step="inspect"
    >
      <BrowserChrome title="example.test / sign-in" />
      <div className="grid grid-cols-[1.1fr_0.9fr] items-center gap-4 p-4 sm:grid-cols-[1.25fr_0.75fr] sm:p-5">
        <div className="sm:order-2">
          <div className="h-2 w-14 rounded-full bg-[var(--soft-border)]" />
          <div className="mt-3 font-mono text-[10px] font-medium text-[var(--graphite)]">
            Welcome back
          </div>
          <div className="mt-1 max-w-24 font-mono text-[8px] leading-3 text-[var(--muted-graphite)]">
            Continue to your workspace
          </div>
        </div>
        <div className="space-y-2 sm:order-1">
          <div className="flex justify-end font-mono text-[9px] uppercase tracking-[0.08em]">
            <span
              className="text-[var(--brand-orange)]"
              data-workflow-label="inspect"
            >
              01 / INSPECT
            </span>
          </div>
          <div className="h-7 rounded-md border border-[var(--soft-border)] bg-white" />
          <div className="h-7 rounded-md border border-[var(--soft-border)] bg-white" />
          <div
            className="relative flex h-8 items-center justify-center rounded-md bg-[var(--brand-orange)] font-mono text-[10px] font-medium text-white"
            data-inspector-target="sign-in"
          >
            <span className="absolute -inset-1.5 rounded-[8px] border border-[var(--brand-orange)]" />
            <span className="absolute -left-2 -top-2 h-2.5 w-2.5 border-l border-t border-[var(--brand-orange)]" />
            Sign in
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeInspectorCharacter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none aspect-[0.62] overflow-hidden select-none sm:overflow-visible',
        className,
      )}
      data-hero-character
    >
      <img
        src="/illustrations/twe-inspector-male-hero-768.png"
        alt="TWE Inspector pointing toward the highlighted Sign in button"
        className="absolute left-1/2 top-1/2 h-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
        width={640}
        height={768}
        loading="eager"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  );
}

function VerificationResult({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 shadow-[0_12px_30px_rgba(29,29,27,0.09)]',
        className,
      )}
      data-hero-step="verify"
    >
      <div
        className="mb-2 font-mono text-[9px] tracking-[0.08em] text-[var(--brand-orange)]"
        data-workflow-label="verify"
      >
        03 / VERIFY
      </div>
      <div className="mb-2 flex items-center justify-between border-t border-[var(--soft-border)] pt-2 font-mono text-[8px] text-[var(--muted-graphite)]">
        <span>EXPECTED → ACTUAL</span>
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="space-y-1 font-mono text-[9px]">
        <div className="flex justify-between gap-3">
          <span className="text-[var(--muted-graphite)]">Expected</span>
          <span>Dashboard</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--muted-graphite)]">Actual</span>
          <span>Dashboard</span>
        </div>
      </div>
      <div
        className="mt-2 flex items-center gap-2 border-t border-[var(--soft-border)] pt-2 font-mono text-[9px] text-[var(--brand-success)]"
        data-result-state="passed"
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        PASSED
      </div>
    </div>
  );
}

function HeroWorkflowTrace() {
  return (
    <svg
      viewBox="0 0 680 590"
      className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full sm:block"
      fill="none"
      aria-hidden="true"
      data-workflow-connectors
    >
      <path
        d="M380 188c36 5 56 19 78 44"
        stroke="var(--brand-orange)"
        strokeDasharray="3 6"
        strokeLinecap="round"
        strokeOpacity="0.68"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function HomeHeroVisual() {
  return (
    <div
      className="relative isolate mx-auto h-[500px] w-full max-w-[680px] overflow-hidden sm:h-[610px] sm:overflow-visible lg:h-[590px]"
      role="group"
      aria-label="Inspect, run, and verify testing workflow"
      data-home-hero-visual
    >
      <div className="sm:hidden">
        <div className="absolute bottom-[1%] left-[14%] z-0 h-20 w-[76%] rounded-[48%] bg-[var(--orange-tint)]/45" />
        <div className="absolute -left-[4%] top-[18%] z-[5] h-[76%] w-[74%] rounded-[38%] bg-[var(--paper-surface)]/65" />

        <InspectTargetBrowser className="absolute left-[2%] top-5 z-10 w-[96%]" />

        <HomeInspectorCharacter className="absolute -left-[2%] top-[23%] z-20 w-[66%]" />

        <div
          className="absolute bottom-4 right-[1%] z-40 w-[57%]"
          data-hero-step="run"
        >
          <PracticePreview compact showWorkflowStep />
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="absolute bottom-[1%] left-[16%] z-0 h-24 w-[78%] rounded-[48%] bg-[var(--orange-tint)]/45" />
        <div className="absolute -left-[2%] top-[16%] z-[5] h-[72%] w-[44%] rounded-[42%] bg-[var(--paper-surface)]/55" />

        <div className="absolute left-[35%] top-[4%] z-10 w-[62%]">
          <InspectTargetBrowser />
        </div>

        <HomeInspectorCharacter className="absolute left-0 top-[16.5%] z-20 w-[50%]" />

        <HeroWorkflowTrace />

        <div
          className="absolute right-0 top-[39%] z-40 w-[52%]"
          data-hero-step="run"
        >
          <PracticePreview
            className="origin-top-right scale-[0.83]"
            showWorkflowStep
          />
        </div>

        <div className="absolute bottom-0 right-0 z-50 w-[25%]">
          <VerificationResult />
        </div>
      </div>
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
    <div className="relative mx-auto min-h-[280px] w-full max-w-[680px] sm:min-h-[295px]">
      <div className="absolute left-[8%] top-[10%] z-20 h-20 w-20 -rotate-6 rounded-md border border-[var(--graphite)] bg-[var(--paper-surface)] p-2 shadow-[0_8px_22px_rgba(29,29,27,0.08)]">
        <div className="flex items-center justify-between border-b border-[var(--soft-border)] pb-1">
          <CalendarDays className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden="true" />
          <span className="font-mono text-[8px] text-[var(--muted-graphite)]">JUN</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="h-2.5 border border-[var(--soft-border)]" />
          ))}
        </div>
      </div>

      <div className="absolute right-[2%] top-[1%] z-20 w-[43%] rounded-lg border border-[var(--graphite)] bg-[var(--paper-surface)] shadow-[0_10px_28px_rgba(29,29,27,0.08)]">
        <div className="flex items-center gap-1.5 border-b border-[var(--soft-border)] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-orange)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#b78327]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-success)]" />
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--brand-success)]" aria-hidden="true" />
            <span className="h-px flex-1 bg-[var(--soft-border)]" />
          </div>
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden="true" />
            <span className="h-px flex-1 bg-[var(--soft-border)]" />
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[var(--graphite)]" aria-hidden="true" />
            <span className="h-px flex-1 bg-[var(--soft-border)]" />
          </div>
        </div>
      </div>

      <div className="absolute left-[4%] top-[38%] z-30 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--graphite)] bg-[var(--paper-surface)] shadow-sm">
        <MessageCircle className="h-7 w-7 text-[var(--graphite)]" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <img
        src="/illustrations/twe-inspector-male-contact-hero.png"
        alt="QA engineer working at a laptop"
        className="absolute bottom-0 left-[15%] z-10 w-[70%] max-w-none object-contain"
        width={1536}
        height={1024}
        loading="eager"
        fetchPriority="high"
      />

      <div className="absolute bottom-[4%] right-[1%] z-30 hidden w-[34%] rounded-md border border-[var(--graphite)] bg-[var(--paper-surface)] p-3 shadow-sm sm:block">
        <div className="mb-2 flex items-center gap-2 font-mono text-[9px] text-[var(--brand-orange)]">
          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          TEST / CONTACT
        </div>
        <div className="space-y-1 font-mono text-[8px] leading-4 text-[var(--graphite)]">
          <p><span className="text-[var(--brand-orange)]">await</span> page.getByRole(<span className="text-[var(--brand-success)]">&apos;button&apos;</span>)</p>
          <p><span className="text-[var(--brand-orange)]">await</span> expect(page).toBeVisible()</p>
        </div>
      </div>

      <div className="absolute bottom-[1%] left-[46%] z-30 hidden -translate-x-1/2 rounded-md border border-[var(--brand-orange)]/40 bg-[var(--paper-surface)] px-3 py-2 font-mono text-[10px] text-[var(--brand-orange)] sm:block">
        LET&apos;S TALK <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
