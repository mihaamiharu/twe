'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type HeroStep = 'inspect' | 'run' | 'verify';
type WorkflowPhase = 'learn' | 'practice' | 'review';

const HERO_STEPS: readonly HeroStep[] = ['inspect', 'run', 'verify'];
const WORKFLOW_PHASES: readonly WorkflowPhase[] = [
  'learn',
  'practice',
  'review',
];

function getStepVerdict(
  step: HeroStep,
  t: (key: string) => string,
): string {
  switch (step) {
    case 'inspect':
      return t('workbench.verdict.inspect');
    case 'run':
      return t('workbench.verdict.run');
    case 'verify':
      return t('workbench.verdict.verify');
  }
}

export function HeroVerificationStage() {
  const { t } = useTranslation('home');
  const [activeStep, setActiveStep] = useState<HeroStep>('verify');
  const [isReplaying, setIsReplaying] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) {
        window.clearTimeout(id);
      }
    };
  }, []);

  const clearTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  const handleSelectStep = (step: HeroStep) => {
    clearTimers();
    setIsReplaying(false);
    setActiveStep(step);
  };

  const handleReplay = () => {
    clearTimers();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setActiveStep('verify');
      setIsReplaying(false);
      return;
    }

    setIsReplaying(true);
    setActiveStep('inspect');
    timersRef.current.push(
      window.setTimeout(() => setActiveStep('run'), 750),
      window.setTimeout(() => {
        setActiveStep('verify');
        setIsReplaying(false);
      }, 1550),
    );
  };

  const showDashboard = activeStep === 'verify';
  const showFilledInputs = activeStep === 'run';
  const showInspectorFocus = activeStep === 'inspect';

  const codeLines: readonly {
    num: string;
    active: boolean;
    content: React.ReactNode;
  }[] = [
    {
      num: '1',
      active: false,
      content: (
        <>
          <span className="text-[#ff8b66]">test</span>
          <span className="text-[#9fa39c]">(</span>
          <span className="text-[#e7ba73]">&apos;sign-in flow&apos;</span>
          <span className="text-[#9fa39c]">
            , async (&#123; page &#125;) =&gt; &#123;
          </span>
        </>
      ),
    },
    {
      num: '2',
      active: showInspectorFocus,
      content: (
        <>
          {'  '}
          <span className="text-[#ff8b66]">await</span> page.goto(
          <span className="text-[#e7ba73]">&apos;/sign-in&apos;</span>);
        </>
      ),
    },
    {
      num: '3',
      active: showFilledInputs,
      content: (
        <>
          {'  '}
          <span className="text-[#ff8b66]">await</span> page.getByLabel(
          <span className="text-[#e7ba73]">&apos;Email&apos;</span>).fill(
          <span className="text-[#e7ba73]">&apos;ekki@qa.dev&apos;</span>);
        </>
      ),
    },
    {
      num: '4',
      active: showInspectorFocus || showFilledInputs,
      content: (
        <>
          {'  '}
          <span className="text-[#ff8b66]">await</span> page.getByRole(
          <span className="text-[#e7ba73]">&apos;button&apos;</span>, &#123;
          name: <span className="text-[#e7ba73]">&apos;Sign in&apos;</span>{' '}
          &#125;)
        </>
      ),
    },
    {
      num: '5',
      active: showInspectorFocus || showFilledInputs,
      content: <>{'    '}.click();</>,
    },
    {
      num: '6',
      active: showDashboard,
      content: (
        <>
          {'  '}
          <span className="text-[#ff8b66]">await</span> expect(
        </>
      ),
    },
    {
      num: '7',
      active: showDashboard,
      content: (
        <>
          {'    '}page.getByRole(
          <span className="text-[#e7ba73]">&apos;heading&apos;</span>, &#123;
          name: <span className="text-[#e7ba73]">&apos;Dashboard&apos;</span>{' '}
          &#125;)
        </>
      ),
    },
    {
      num: '8',
      active: showDashboard,
      content: <>{'  '}).toBeVisible();</>,
    },
    {
      num: '9',
      active: false,
      content: <span className="text-[#9fa39c]">&#125;);</span>,
    },
  ];

  return (
    <div
      className="surface-dark mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-white/12 bg-[#161918] text-[#f4f3ee] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
      role="region"
      aria-label={t('workbench.ariaLabel')}
      data-home-hero-visual
    >
      {/* Workbench control bar: single line on desktop, compact 2-row on mobile */}
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#1c201e] px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center justify-between gap-3 lg:contents">
          <span className="font-mono text-[0.875rem] text-[#c7c5bc]">
            {t('workbench.file')}
          </span>

          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.875rem] font-medium text-[#f4f3ee] transition-[background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e65f3a] lg:order-3 lg:justify-self-end"
          >
            <Play
              className="h-3.5 w-3.5 fill-current text-[#ff8b66]"
              aria-hidden="true"
            />
            {isReplaying ? t('workbench.running') : t('workbench.runCheck')}
          </button>
        </div>

        {/* Connected segmented control for the 3 verification stages */}
        <div
          role="tablist"
          aria-label={t('workbench.ariaLabel')}
          className="grid w-full grid-cols-3 rounded-lg border border-white/12 bg-[#121514] p-1 lg:order-2 lg:inline-flex lg:w-auto"
        >
          {HERO_STEPS.map((step) => {
            const isSelected = activeStep === step;
            return (
              <button
                key={step}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-hero-step={step}
                onClick={() => handleSelectStep(step)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-[0.875rem] font-medium transition-[background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e65f3a]',
                  isSelected
                    ? 'bg-[#fbf9f4] text-[#141615]'
                    : 'text-[#c2c0b8] hover:text-white',
                )}
              >
                {t(`workbench.steps.${step}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-pane verification stage */}
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left pane: Live Target Browser with stable height across steps */}
        <div className="flex min-w-0 border-b border-white/10 bg-[#121514] p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex w-full flex-col overflow-hidden rounded-xl border border-[#d9d3c8]/30 bg-[#fbf9f4] text-[#1d1d1b]">
            <div className="flex items-center justify-between gap-4 border-b border-[#e5dfd4] bg-[#f4f0e8] px-4 py-2 text-[0.875rem] text-[#5e5a54]">
              <span className="min-w-0 truncate font-mono">
                {showDashboard
                  ? t('workbench.browser.dashboardUrl')
                  : t('workbench.browser.signInUrl')}
              </span>
              <span className="shrink-0 tabular-nums text-[#5e5a54]">
                {showDashboard ? '200 OK' : 'DOM'}
              </span>
            </div>

            {showDashboard ? (
              <div className="flex min-h-[248px] flex-1 flex-col justify-between p-4 sm:p-5">
                <div className="rounded-lg border-2 border-[#23856d] bg-[#eef8f4] p-4 transition-[border-color,background-color] duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[1.0625rem] font-semibold text-[#141615]">
                      {t('workbench.browser.dashboardHeading')}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-[#186854]">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {t('workbench.browser.assertionCallout')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.875rem] text-[#4c4a45]">
                    {t('workbench.browser.dashboardSubtext')}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e5dfd4] pt-3.5 text-[0.875rem] text-[#5e5a54] tabular-nums">
                  <span>{t('workbench.browser.dashboardChecks')}</span>
                  <span className="shrink-0 font-medium text-[#186854]">
                    42 ms
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[248px] flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                  <p className="text-[1.0625rem] font-semibold text-[#141615]">
                    {t('workbench.browser.signInHeading')}
                  </p>

                  <div className="mt-3 space-y-2.5">
                    <div>
                      <div className="text-[0.875rem] text-[#5e5a54]">
                        {t('workbench.browser.emailLabel')}
                      </div>
                      <div
                        className={cn(
                          'mt-1 flex h-9 items-center rounded-md border px-3 text-[0.875rem] transition-[border-color,background-color] duration-200',
                          showFilledInputs
                            ? 'border-[#b23f1c] bg-white text-[#141615]'
                            : 'border-[#d9d3c8] bg-white text-[#76726b]',
                        )}
                      >
                        {showFilledInputs
                          ? t('workbench.browser.emailPlaceholder')
                          : 'name@company.com'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[0.875rem] text-[#5e5a54]">
                        {t('workbench.browser.passwordLabel')}
                      </div>
                      <div className="mt-1 flex h-9 items-center rounded-md border border-[#d9d3c8] bg-white px-3 text-[0.875rem] text-[#5e5a54]">
                        {showFilledInputs ? '••••••••••••' : '••••••••'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md text-[0.875rem] font-medium text-white transition-[background-color,transform] duration-200',
                      showFilledInputs
                        ? 'translate-y-px bg-[#963315]'
                        : 'bg-[#b23f1c]',
                      showInspectorFocus &&
                        'ring-2 ring-[#e65f3a] ring-offset-2 ring-offset-[#fbf9f4]',
                    )}
                  >
                    {t('workbench.browser.signInAction')}
                  </div>
                  <p
                    className={cn(
                      'mt-2 min-h-[1.25rem] font-mono text-[0.875rem] transition-[opacity] duration-200',
                      showInspectorFocus
                        ? 'text-[#b23f1c] opacity-100'
                        : 'text-transparent opacity-0 select-none',
                    )}
                    aria-hidden={!showInspectorFocus}
                  >
                    {t('workbench.browser.locatorCallout')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Playwright TypeScript spec & live verdict */}
        <div className="flex min-w-0 flex-col justify-between bg-[#161918]">
          <div className="overflow-x-auto px-4 py-4 sm:px-5 sm:py-5">
            <pre className="font-mono text-[0.875rem] leading-[1.65] text-[#f4f3ee]">
              <code>
                {codeLines.map((line) => (
                  <span
                    key={line.num}
                    className={cn(
                      'block border-l-2 px-3 transition-[background-color,border-color] duration-200',
                      line.active
                        ? 'border-[#e65f3a] bg-white/[0.06]'
                        : 'border-transparent',
                    )}
                  >
                    <span className="mr-4 inline-block w-3 select-none text-right tabular-nums text-[#7e827b]">
                      {line.num}
                    </span>
                    {line.content}
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <div
            className="flex items-center gap-3 border-t border-white/10 bg-[#1a1e1c] px-5 py-3.5 text-[0.875rem] tabular-nums sm:px-6"
            aria-live="polite"
          >
            <Check
              className={cn(
                'h-4 w-4 shrink-0',
                activeStep === 'verify'
                  ? 'text-[#55d3ad]'
                  : 'text-[#ff8b66]',
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                activeStep === 'verify'
                  ? 'text-[#aef0da]'
                  : 'text-[#e0dfd8]',
              )}
            >
              {getStepVerdict(activeStep, t)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowSpotlight() {
  const { t } = useTranslation('home');
  const [phase, setPhase] = useState<WorkflowPhase>('practice');

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.44fr_0.56fr] lg:gap-16">
      {/* Ruled interactive phase selector */}
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label={t('learnPractice.eyebrow')}
        className="border-t border-[#d4cec2]"
      >
        {WORKFLOW_PHASES.map((item) => {
          const isActive = phase === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setPhase(item)}
              className={cn(
                'block w-full border-b border-[#d4cec2] border-l-2 py-6 pl-5 pr-2 text-left transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b23f1c]',
                isActive
                  ? 'border-l-[#b23f1c] bg-[#e7e2d6]/65'
                  : 'border-l-transparent hover:bg-[#e7e2d6]/35',
              )}
            >
              <span className="block text-[1.0625rem] font-semibold text-[#141615]">
                {t(`learnPractice.steps.${item}.title`)}
              </span>
              <span className="mt-2 block max-w-[44ch] text-[1.0625rem] leading-[1.6] text-[#55524c]">
                {t(`learnPractice.steps.${item}.description`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Synchronized stage panel */}
      <div
        role="tabpanel"
        className="min-w-0 overflow-hidden rounded-2xl border border-[#d4cec2] bg-[#fbf9f4]"
      >
        {phase === 'learn' && (
          <div className="p-6 sm:p-8">
            <h3 className="text-[1.0625rem] font-semibold text-[#141615]">
              {t('learnPractice.spotlight.learnTitle')}
            </h3>
            <p className="mt-3 max-w-[54ch] text-[1.0625rem] leading-[1.65] text-[#55524c]">
              {t('learnPractice.spotlight.learnBody')}
            </p>

            <div className="mt-7 divide-y divide-[#e5dfd4] border-y border-[#e5dfd4]">
              <div className="py-4">
                <p className="text-[0.875rem] font-medium text-[#9f342c]">
                  {t('learnPractice.spotlight.learnAvoidLabel')}
                </p>
                <pre className="mt-2 overflow-x-auto font-mono text-[0.875rem] text-[#55524c]">
                  <code>{t('learnPractice.spotlight.learnAvoidCode')}</code>
                </pre>
              </div>
              <div className="py-4">
                <p className="text-[0.875rem] font-medium text-[#186854]">
                  {t('learnPractice.spotlight.learnPreferLabel')}
                </p>
                <pre className="mt-2 overflow-x-auto font-mono text-[0.875rem] text-[#141615]">
                  <code>{t('learnPractice.spotlight.learnPreferCode')}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {phase === 'practice' && (
          <div className="surface-dark bg-[#161918] text-[#f4f3ee]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 text-[0.875rem] text-[#c7c5bc]">
              <span className="min-w-0 truncate font-mono">
                {t('learnPractice.spotlight.practiceFile')}
              </span>
              <span className="shrink-0">Playwright</span>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[1.0625rem] leading-[1.6] text-[#d9d7cf]">
                {t('learnPractice.spotlight.practiceTask')}
              </p>
              <pre className="mt-6 overflow-x-auto border-l-2 border-[#e65f3a] bg-white/[0.04] py-4 pl-4 pr-4 font-mono text-[0.875rem] leading-7 text-[#f4f3ee]">
                <code>
                  <span className="text-[#ff8b66]">await</span> page
                  {'\n'}
                  {'  '}.getByRole(
                  <span className="text-[#e7ba73]">&apos;button&apos;</span>,
                  &#123; name:{' '}
                  <span className="text-[#e7ba73]">&apos;Checkout&apos;</span>{' '}
                  &#125;)
                  {'\n'}
                  {'  '}.click();
                  {'\n'}
                  <span className="text-[#ff8b66]">await</span>{' '}
                  expect(page.getByRole(
                  <span className="text-[#e7ba73]">&apos;status&apos;</span>))
                  {'\n'}
                  {'  '}.toContainText(
                  <span className="text-[#e7ba73]">
                    &apos;Order confirmed&apos;
                  </span>
                  );
                </code>
              </pre>
              <p className="mt-6 text-[0.875rem] text-[#a8aba4]">
                {t('learnPractice.spotlight.practiceStatus')}
              </p>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dfd4] pb-4">
              <h3 className="text-[1.0625rem] font-semibold text-[#141615]">
                {t('learnPractice.spotlight.reviewHeading')}
              </h3>
              <span className="text-[0.875rem] font-medium tabular-nums text-[#186854]">
                {t('learnPractice.spotlight.reviewDuration')}
              </span>
            </div>
            <ul className="divide-y divide-[#e5dfd4]">
              {(['locator', 'action', 'assertion'] as const).map(
                (checkKey) => (
                  <li
                    key={checkKey}
                    className="flex items-start gap-3 py-4 text-[1.0625rem] leading-[1.55] text-[#1d1d1b]"
                  >
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-[#186854]"
                      aria-hidden="true"
                    />
                    <span>
                      {t(`learnPractice.spotlight.reviewChecks.${checkKey}`)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const LABS_PIPELINE_KEYS = ['repository', 'apis', 'suite', 'ci'] as const;

export function LabsPipelineSchematic() {
  const { t } = useTranslation('home');

  return (
    <div className="relative pl-8">
      {/* Precision emerald vertical spine aligned dead-center with node dots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-[5px] top-8 w-px bg-[#4fd1a5]/35"
      />

      <ol className="divide-y divide-white/12 border-y border-white/12">
        {LABS_PIPELINE_KEYS.map((key) => (
          <li key={key} className="relative py-6">
            <span
              aria-hidden="true"
              className="absolute -left-8 top-[1.875rem] h-[11px] w-[11px] rounded-full border-2 border-[#4fd1a5] bg-[#13201c]"
            />
            <h3 className="text-[1.0625rem] font-semibold text-[#f4f3ee]">
              {t(`labs.pipeline.${key}.title`)}
            </h3>
            <p className="mt-1.5 max-w-[48ch] text-[1.0625rem] leading-[1.6] text-[#b8c7c1]">
              {t(`labs.pipeline.${key}.description`)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
