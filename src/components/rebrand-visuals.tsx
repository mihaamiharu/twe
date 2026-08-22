import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  Mail,
  MessageCircle,
  Play,
  Search,
  Send,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
              {'  '}&#123; name: <span className="text-[#b78327]">'Sign in'</span> &#125;
              ).click(){'\n'}
              <span className="text-[#a5a69f]">3 </span>
              <span className="text-[#e65f3a]">await</span> expect(page.getByText(
              {'\n'}
              <span className="text-[#a5a69f]">4 </span>
              {'  '}<span className="text-[#b78327]">'Dashboard'</span>
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

export function QaEngineerIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 360"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="QA engineer reviewing a browser test on a laptop"
    >
      <defs>
        <marker id="qa-arrowhead" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5" viewBox="0 0 7 7">
          <path d="M0 0 7 3.5 0 7" fill="none" stroke="var(--brand-orange)" strokeWidth="1.2" />
        </marker>
      </defs>

      <g fill="none" stroke="var(--graphite)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <rect x="20" y="22" width="164" height="92" rx="8" fill="var(--paper-surface)" />
        <path d="M20 45h164" stroke="var(--soft-border)" />
        <circle cx="34" cy="34" r="3" fill="var(--brand-orange)" stroke="none" />
        <circle cx="45" cy="34" r="3" fill="var(--muted-graphite)" stroke="none" />
        <circle cx="56" cy="34" r="3" fill="var(--brand-success)" stroke="none" />
        <rect x="37" y="59" width="88" height="9" rx="3" stroke="var(--soft-border)" />
        <rect x="37" y="77" width="117" height="9" rx="3" stroke="var(--soft-border)" />
        <rect x="37" y="94" width="57" height="9" rx="3" fill="var(--brand-orange)" stroke="none" />
        <path d="M135 93 146 103l8-15" stroke="var(--brand-orange)" />

        <rect x="337" y="25" width="162" height="112" rx="8" fill="var(--paper-surface)" />
        <path d="M354 53h78M354 72h120M354 91h92M354 110h68" stroke="var(--soft-border)" />
        <path d="m347 53 4 4 7-9M347 72l4 4 7-9M347 91l4 4 7-9" stroke="var(--brand-orange)" />
        <path d="M364 122h103" stroke="var(--brand-success)" />

        <rect x="369" y="187" width="130" height="66" rx="8" fill="var(--paper-surface)" />
        <circle cx="388" cy="210" r="9" stroke="var(--brand-success)" />
        <path d="m384 210 3 3 6-7M410 208h70M410 225h52" stroke="var(--brand-success)" />
        <path d="M410 243h34" stroke="var(--soft-border)" />

        <path d="M184 75c32-7 63-2 87 18" markerEnd="url(#qa-arrowhead)" stroke="var(--brand-orange)" strokeDasharray="4 6" />
        <path d="M338 120c-34 2-48 26-53 57" markerEnd="url(#qa-arrowhead)" stroke="var(--brand-orange)" strokeDasharray="4 6" />
        <path d="M373 220c-22 8-42 18-59 34" markerEnd="url(#qa-arrowhead)" stroke="var(--brand-orange)" strokeDasharray="4 6" />

        <path d="M197 186c16-13 43-18 71-11 22 6 42 21 50 44l-20 84H191l-17-83c3-14 10-25 23-34Z" fill="var(--orange-tint)" />
        <path d="M224 177v-17h26v17" fill="var(--paper-surface)" />
        <path d="M212 109c8-18 36-25 55-12 15 10 18 32 9 52-8 17-26 28-44 20-20-9-28-39-20-60Z" fill="var(--paper-surface)" />
        <path d="M210 122c3-28 24-39 47-32 12 4 22 14 23 27-9-7-18-10-29-8-13 3-25 10-41 13Z" fill="var(--graphite)" stroke="none" />
        <path d="M225 141c7 4 16 4 23 0M239 150h8" />
        <circle cx="226" cy="130" r="10" fill="var(--paper-surface)" />
        <circle cx="254" cy="130" r="10" fill="var(--paper-surface)" />
        <path d="M236 130h8M221 130h-5M264 130h5" />
        <circle cx="226" cy="130" r="2" fill="var(--graphite)" stroke="none" />
        <circle cx="254" cy="130" r="2" fill="var(--graphite)" stroke="none" />

        <path d="M207 191c-16 8-27 22-35 39l-40 24c-6 4-5 13 2 16l53-16 44-31M276 192c17 9 29 24 37 42l39 21c7 4 6 14-2 17l-51-15-40-33" fill="var(--orange-tint)" />
        <path d="M132 251c-6 3-8 9-2 14M316 255c6 3 9 9 3 14" stroke="var(--brand-orange)" />
        <path d="M211 187 201 207M275 187l10 20" stroke="var(--brand-orange)" />

        <path d="M171 273h166l-11 60H183l-12-60Z" fill="var(--paper-surface)" />
        <path d="M158 333h193l-13 10H171l-13-10Z" fill="var(--soft-border)" />
        <path d="M192 288h104M192 301h77M192 314h46" stroke="var(--soft-border)" />
        <path d="M306 290h12M306 303h20M306 316h8" stroke="var(--brand-orange)" />
        <path d="M199 346h105" stroke="var(--graphite)" />
      </g>

      <g fill="var(--brand-orange)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="500" letterSpacing="1">
        <text x="22" y="12">BROWSER TARGET</text>
        <text x="340" y="15">PLAYWRIGHT</text>
        <text x="371" y="178">ASSERTION</text>
      </g>
    </svg>
  );
}

export function HomeHeroVisual() {
  return (
    <div className="relative mx-auto min-h-[430px] w-full max-w-[590px] lg:min-h-[520px]">
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
        <div className="absolute -bottom-8 -right-5 flex items-center gap-2 font-mono text-[11px] text-[var(--brand-orange)]">
          <Search className="h-4 w-4" aria-hidden="true" />
          01 / INSPECT
        </div>
      </div>

      <div className="absolute right-0 top-[20%] z-10 w-[92%] sm:w-[64%]">
        <PracticePreview />
        <div className="absolute -left-7 top-12 hidden items-center gap-2 font-mono text-[11px] text-[var(--brand-orange)] sm:flex">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          02 / EXECUTE
        </div>
      </div>

      <div className="absolute bottom-[7%] left-[2%] z-[4] w-[56%] min-w-[240px] sm:left-[1%] sm:w-[54%]">
        <QaEngineerIllustration />
      </div>

      <div className="absolute bottom-[2%] left-[10%] hidden w-[55%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)] sm:block">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] text-[var(--muted-graphite)]">
          <span>EXPECTED → ACTUAL</span>
          <Check className="h-4 w-4 text-[var(--brand-success)]" aria-hidden="true" />
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
        <div className="absolute -bottom-6 -right-8 hidden items-center gap-2 font-mono text-[11px] text-[var(--brand-orange)] sm:flex">
          03 / VERIFY <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 -z-10 h-36 rounded-[45%] bg-[var(--orange-tint)]/60 blur-2xl" />
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
        <Code2 className="mr-2 inline h-3.5 w-3.5 text-[var(--brand-orange)]" aria-hidden="true" />
        AUTOMATION
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
        <MessageCircle className="h-full w-full text-[var(--graphite)]" strokeWidth={1.4} aria-hidden="true" />
      </div>
      <div className="absolute right-[4%] top-[4%] w-[58%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)]">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--soft-border)] pb-3 font-mono text-[10px] text-[var(--muted-graphite)]">
          <span>CONTACT / TWE</span>
          <Mail className="h-4 w-4 text-[var(--brand-orange)]" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          {['Mentoring', 'Partnerships', 'General message'].map((item, index) => (
            <div key={item} className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-[var(--brand-orange)]">0{index + 1}</span>
              <span className="h-px flex-1 bg-[var(--soft-border)]" />
              <span className="text-[var(--graphite)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[7%] left-[18%] w-[58%] rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)] p-4 shadow-[0_12px_35px_rgba(29,29,27,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-orange)]/40 bg-[var(--orange-tint)] text-[var(--brand-orange)]">
            <Send className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-[var(--graphite)]">Choose a topic</div>
            <div className="font-mono text-[10px] text-[var(--muted-graphite)]">MESSAGE → RESPONSE</div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[4%] right-[5%] hidden rounded-md border border-[var(--brand-orange)]/40 bg-[var(--paper-surface)] px-3 py-2 font-mono text-[11px] text-[var(--brand-orange)] sm:block">
        LET&apos;S TALK <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
