import { describe, expect, test } from 'bun:test';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { motion } from 'framer-motion';

describe('Framer Motion preload mock', () => {
  test('strips motion props while preserving intrinsic props and refs', () => {
    const divRef = createRef<HTMLDivElement>();
    const pathRef = createRef<SVGPathElement>();
    const { container, getByTestId } = render(
      <>
        <motion.div
          ref={divRef}
          data-testid="motion-div"
          className="card"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Content
        </motion.div>
        <svg>
          <motion.path
            ref={pathRef}
            data-testid="motion-path"
            d="M0 0L1 1"
            variants={{ visible: { opacity: 1 } }}
          />
        </svg>
      </>,
    );

    const div = getByTestId('motion-div');
    const path = getByTestId('motion-path');
    expect(div.className).toBe('card');
    expect(div.textContent).toBe('Content');
    expect(div.hasAttribute('layout')).toBe(false);
    expect(div.hasAttribute('initial')).toBe(false);
    expect(div.hasAttribute('animate')).toBe(false);
    expect(path.getAttribute('d')).toBe('M0 0L1 1');
    expect(path.hasAttribute('variants')).toBe(false);
    expect(divRef.current?.getAttribute('data-testid')).toBe('motion-div');
    expect(pathRef.current?.getAttribute('data-testid')).toBe('motion-path');
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
  });
});
