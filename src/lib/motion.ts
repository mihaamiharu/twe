import type { CSSProperties } from 'react';

/** Stagger position for the `.reveal*` utilities in styles.css (60ms steps). */
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}
