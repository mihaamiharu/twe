import { cn } from '@/lib/utils';

/**
 * Reusable editorial line scene of a QA engineer actively working.
 * Product-specific browser, editor, and result artifacts remain outside the
 * SVG so public pages can compose the figure into their own testing story.
 */
export function QaEngineerIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 420"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="QA engineer leaning toward a laptop and reviewing a test"
      data-qa-illustration="engineer-at-work"
    >
      <g
        fill="none"
        stroke="var(--graphite)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Desk and chair keep the figure grounded rather than floating. */}
        <path d="M20 382c152-4 353 5 580 0" strokeWidth="1.8" />
        <path
          d="M58 394c137 7 311 7 469 1"
          stroke="var(--soft-border)"
          strokeWidth="1.1"
        />
        <path
          d="M126 280c-22 10-32 30-28 60l2 42M98 344h54"
          stroke="var(--soft-border)"
          strokeWidth="1.35"
        />

        {/* Torso turns and leans toward the workstation. */}
        <path
          d="M248 202c-43 5-77 29-96 72-14 31-18 67-10 105h225l10-78c1-43-24-79-70-98l-31 24-28-25Z"
          fill="var(--paper-surface)"
          strokeWidth="1.9"
        />
        <path
          d="M248 202c7 14 17 24 29 29l30-28M231 214c14 15 29 24 46 29M327 215c-11 13-24 22-39 28"
          strokeWidth="1.45"
        />
        <path
          d="M277 243c4 34 5 70 2 108M210 231c14 11 29 18 47 22"
          stroke="var(--soft-border)"
          strokeWidth="1.1"
        />

        <g transform="translate(56 39) scale(.76) rotate(9 282 132)">
          {/* Elongated adult head turns and tips down toward the workstation. */}
          <path
            d="M231 79c15-22 42-32 66-24 22 7 36 25 37 48l17 13-18 10c-2 28-15 49-36 58-25 11-52 2-66-20-13-20-15-62 0-85Z"
            fill="var(--paper-surface)"
            strokeWidth="1.9"
          />
          <path
            d="M226 98c-4-26 11-49 36-59 28-11 59-2 74 21-14-5-26-5-38-2l8 7-20-4 3 9-18-6-7 12-10-6-8 14-10-3-4 18-6-1Z"
            fill="var(--graphite)"
            stroke="none"
          />
          <path
            d="M230 97c-5 13-5 27-2 41M331 81c5 12 6 25 2 39"
            strokeWidth="1.25"
          />
          <path
            d="M228 118c-8-3-13 3-10 13 3 11 9 16 17 14"
            fill="var(--paper-surface)"
            strokeWidth="1.6"
          />

          {/* Near lens dominates the perspective; pupils sit low and right. */}
          <path
            d="m246 106 20 2c5 1 7 4 6 9l-1 5c-1 6-5 8-10 7l-12-1c-6-1-8-5-7-11l1-6c0-3 1-4 3-5ZM279 109l29 5c5 1 8 5 7 10l-1 6c-1 6-6 9-12 7l-17-3c-7-1-10-6-8-12l1-6c0-3 0-5 1-7ZM272 116l6 1"
            fill="var(--paper-surface)"
            strokeWidth="1.5"
          />
          <path d="m244 103 21-2M282 104l25 4" strokeWidth="1.1" />
          <circle
            cx="260"
            cy="121"
            r="1.8"
            fill="var(--graphite)"
            stroke="none"
          />
          <circle
            cx="299"
            cy="130"
            r="2.1"
            fill="var(--graphite)"
            stroke="none"
          />
          <path
            d="M315 135c8 4 12 9 13 14l-11 4M293 166c8 1 15-1 21-5M278 150c3 2 5 3 8 3"
            strokeWidth="1.35"
          />
        </g>

        {/* Neck follows the head turn instead of centering on the torso. */}
        <path d="M254 176l2 30M283 179l19 25" strokeWidth="1.6" />

        {/* Far arm bends from shoulder to the keyboard. */}
        <path
          d="M207 227c-24 18-40 46-47 82-5 26 8 43 36 47l90 11"
          strokeWidth="2"
        />
        <path
          d="M177 296c11 7 24 11 38 12M163 321c15 5 31 7 47 5"
          stroke="var(--soft-border)"
          strokeWidth="1.1"
        />

        {/* Near arm reaches across the body to the trackpad. */}
        <path d="M327 221c25 16 42 40 48 70l8 39" strokeWidth="2" />
        <path
          d="M351 253c-5 14-6 30-2 46"
          stroke="var(--soft-border)"
          strokeWidth="1.1"
        />

        {/* Hands stay compact and follow the keyboard perspective. */}
        <path
          d="M273 342c8-8 17-11 27-8l18 6 30 1c6 0 8 6 3 9l-24 5 25 3c5 1 5 7 0 8l-37-1-31-8c-9-2-15-9-11-15Z"
          fill="var(--paper-surface)"
          strokeWidth="1.55"
        />
        <path
          d="m290 340 32 9M298 336l29 8M307 337l26 7"
          stroke="var(--muted-graphite)"
          strokeWidth="0.95"
        />
        <path
          d="M347 329c7-9 16-13 27-11l22 6 27-2c6 0 8 6 3 9l-23 7 26 1c6 0 7 7 1 9l-31 4 21 5c5 1 5 7-1 8l-38-3-27-11c-10-4-13-13-7-22Z"
          fill="var(--paper-surface)"
          strokeWidth="1.55"
        />
        <path
          d="m366 326 33 11M365 335l36 9M367 344l32 8"
          stroke="var(--muted-graphite)"
          strokeWidth="0.95"
        />

        {/* Laptop sits in the same physical plane as both hands. */}
        <path
          d="M391 238h203l-31 121H365l26-121Z"
          fill="var(--paper-surface)"
          strokeWidth="1.9"
        />
        <path
          d="M365 359h198l37 19H321l44-19Z"
          fill="var(--paper-surface)"
          strokeWidth="1.75"
        />
        <path
          d="M384 368h155M346 374h218"
          stroke="var(--soft-border)"
          strokeWidth="1.05"
        />
        <path
          d="M469 286h22l5 18-16 12-17-12 6-18Z"
          stroke="var(--soft-border)"
          strokeWidth="1.15"
        />
        <path
          d="m471 301 7 6 13-16"
          stroke="var(--brand-orange)"
          strokeWidth="1.6"
        />
      </g>
    </svg>
  );
}
