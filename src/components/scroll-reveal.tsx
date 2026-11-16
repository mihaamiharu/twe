import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

const SELECTOR = '.reveal-scroll';

/**
 * Plays a one-off rise-in on `.reveal-scroll` elements as they scroll into
 * view. Content is never hidden by CSS: without JS, before hydration, in print
 * and under reduced motion it simply renders in place, and anything already on
 * screen stays put. Stagger siblings with style={stagger(n)}.
 */
export function ScrollReveal() {
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const reported = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const isFirstReport = !reported.has(element);
        reported.add(element);

        if (!entry.isIntersecting) continue;
        observer.unobserve(element);
        // Only animate elements arriving from below the fold after load.
        if (isFirstReport || entry.boundingClientRect.top < 0) continue;

        const index =
          Number(getComputedStyle(element).getPropertyValue('--i')) || 0;
        element.animate(
          [
            { opacity: 0, translate: '0 14px' },
            { opacity: 1, translate: '0 0' },
          ],
          {
            duration: 520,
            delay: index * 60,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
            fill: 'backwards',
          },
        );
      }
    });

    // Wait a frame so the incoming route's markup is committed.
    const frame = requestAnimationFrame(() => {
      document
        .querySelectorAll(SELECTOR)
        .forEach((element) => observer.observe(element));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
