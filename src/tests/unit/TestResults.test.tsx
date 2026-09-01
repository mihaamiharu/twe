import { describe, expect, it } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestResults } from '@/components/challenges/test-results';

describe('TestResults', () => {
  it('exposes the exact negative feedback when a failed result is expanded', () => {
    const errorMessage =
      'The required calls were not executed in the test path: getByRole.';

    render(
      <TestResults
        challengeType="PLAYWRIGHT"
        results={[
          {
            id: 'main',
            name: 'Workflow Execution',
            passed: false,
            error: errorMessage,
          },
        ]}
      />,
    );

    expect(screen.getByText('✕ FAILED')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expand Failed' })).toBeTruthy();
    expect(screen.queryByText(errorMessage)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Expand Failed' }));

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });
});
