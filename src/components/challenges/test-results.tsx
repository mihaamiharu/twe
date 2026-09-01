/**
 * TestResults - Component to display test case execution results
 *
 * Features:
 * - Show pass/fail status for each test
 * - Expandable error details
 * - Summary stats (passed/total)
 * - Animation for results
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { ChallengeType } from './playground';
import type { JsonValue } from '@/lib/content.types';

export interface TestResult {
  id: string;
  name: string;
  description?: string;
  passed: boolean;
  output?: JsonValue;
  expected?: unknown;
  error?: string;
  executionTime?: number;
  isHidden?: boolean;
}

// Copy configuration for different challenge types
const COPY_CONFIG: Record<
  ChallengeType | 'DEFAULT',
  { success: string; failure: string; testName: string }
> = {
  CSS_SELECTOR: {
    success: 'Target Acquired!',
    failure: 'Target Missed',
    testName: 'Element Selection',
  },
  XPATH_SELECTOR: {
    success: 'XPath Verified!',
    failure: 'XPath Missed',
    testName: 'Element Selection',
  },
  JAVASCRIPT: {
    success: 'Tests Passed!',
    failure: 'Logic Error',
    testName: 'Logical Verification',
  },
  TYPESCRIPT: {
    success: 'Tests Passed!',
    failure: 'Type Error',
    testName: 'Type-Safe Verification',
  },
  PLAYWRIGHT: {
    success: 'Scenario Passed!',
    failure: 'Scenario Failed',
    testName: 'Workflow Execution',
  },
  SELECTOR: {
    success: 'Target Hit!',
    failure: 'Target Missed',
    testName: 'Selector Verification',
  },
  DEFAULT: {
    success: 'Mission Accomplished!',
    failure: 'Refinement Needed',
    testName: 'Test Case',
  },
};

export interface TestResultsProps {
  results: TestResult[];
  isRunning?: boolean;
  totalHiddenTests?: number;
  hiddenTestsPassed?: number;
  challengeType?: ChallengeType;
  className?: string;
}

export function TestResults({
  results,
  isRunning = false,
  totalHiddenTests = 0,
  hiddenTestsPassed = 0,
  challengeType,
  className,
}: TestResultsProps) {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // Get copy based on challenge type
  const copy = COPY_CONFIG[challengeType || 'DEFAULT'] || COPY_CONFIG.DEFAULT;
  const isSingleTest = results.length === 1 && totalHiddenTests === 0;

  // Calculate stats
  const visiblePassed = results.filter((r) => r.passed).length;
  const totalPassed = visiblePassed + hiddenTestsPassed;
  const totalTests = results.length + totalHiddenTests;
  const allPassed = totalPassed === totalTests && totalTests > 0;

  // Toggle test expansion
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTests(newExpanded);
  };

  // Expand/collapse all
  const expandAll = () => {
    const failedIds = results
      .filter((r) => !r.passed && r.error)
      .map((r) => r.id);
    setExpandedTests(new Set(failedIds));
  };

  const collapseAll = () => {
    setExpandedTests(new Set());
  };

  if (isRunning) {
    return (
      <div
        className={cn(
          'p-4 rounded-md border border-workspace-border bg-workspace-panel',
          className,
        )}
      >
        <div className="flex items-center gap-3 text-workspace-muted">
          <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
          <span className="font-mono text-xs tracking-wide">RUNNING…</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className={cn(
          'p-8 rounded-md border border-workspace-border bg-workspace-panel border-dashed text-center flex flex-col items-center justify-center h-full min-h-[160px]',
          className,
        )}
      >
        <div className="bg-workspace-elevated p-3 rounded-md mb-3 border border-workspace-border">
          <Clock className="h-5 w-5 text-workspace-muted" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1">
          Ready to Run
        </h3>
        <p className="text-sm text-workspace-muted max-w-[240px]">
          Run your solution to see test results and validation details here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-workspace-border bg-workspace-panel overflow-hidden',
        className,
      )}
    >
      {/* Header with Summary */}
      <div
        className={cn(
          'px-4 py-3 border-b border-workspace-border flex items-center justify-between',
          allPassed ? 'bg-brand-success/10' : 'bg-brand-error/10',
        )}
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <CheckCircle2 className="h-5 w-5 text-brand-success" />
          ) : (
            <XCircle className="h-5 w-5 text-brand-error" />
          )}
          <div>
            <span
              className={cn(
                'font-mono text-sm font-medium tracking-wide',
                allPassed ? 'text-brand-success' : 'text-brand-error',
              )}
            >
              {allPassed ? '✓ PASSED' : '✕ FAILED'}
            </span>
            <span className="text-workspace-muted ml-2 font-mono text-xs">
              [{totalPassed}/{totalTests}]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {results.some((r) => !r.passed && r.error) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-8 text-xs font-medium border border-workspace-border text-workspace-muted hover:text-workspace-text hover:bg-workspace-elevated"
            >
              Expand Failed
            </Button>
          )}
          {expandedTests.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-8 text-xs font-medium border border-workspace-border text-workspace-muted hover:text-workspace-text hover:bg-workspace-elevated"
            >
              Collapse All
            </Button>
          )}
        </div>
      </div>

      {/* Test Results List */}
      <div className="divide-y divide-workspace-border">
        {results.map((result, index) => (
          <div key={result.id} className="group">
            {/* Test Header Row */}
            <button
              onClick={() => result.error && toggleExpand(result.id)}
              className={cn(
                'w-full min-h-12 px-4 py-3 flex items-center gap-3 text-left transition-colors',
                result.error && 'hover:bg-workspace-elevated cursor-pointer',
                !result.error && 'cursor-default',
              )}
            >
              {/* Pass/Fail Icon */}
              {result.passed ? (
                <CheckCircle2 className="h-4 w-4 text-brand-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-brand-error shrink-0" />
              )}

              {/* Test Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {isSingleTest
                      ? result.name || copy.testName
                      : `Test ${index + 1}: ${result.name || result.description || 'Test Case'}`}
                  </span>
                  {result.isHidden && (
                    <Badge variant="secondary" className="text-xs">
                      Hidden
                    </Badge>
                  )}
                </div>
                {result.description && result.name !== result.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {result.description}
                  </p>
                )}
              </div>

              {/* Execution Time */}
              {result.executionTime !== undefined && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {result.executionTime}ms
                </div>
              )}

              {/* Expand Icon */}
              {result.error && (
                <div className="shrink-0">
                  {expandedTests.has(result.id) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </button>

            {/* Expanded Error Details */}
            {expandedTests.has(result.id) && result.error && (
              <div className="px-4 pb-4 pt-0 ml-7 space-y-4">
                {/* Error Message */}
                <div className="p-4 rounded-md bg-brand-error/10 border border-brand-error/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-brand-error shrink-0 mt-1" />
                    <pre className="text-sm text-brand-error font-mono whitespace-pre-wrap break-words leading-relaxed">
                      {result.error}
                    </pre>
                  </div>
                </div>

                {/* Expected vs Actual */}
                {(result.expected !== undefined ||
                  result.output !== undefined) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.expected !== undefined && (
                      <div className="p-3 rounded-md bg-brand-success/10 border border-brand-success/30">
                        <div className="text-xs font-medium text-brand-success mb-2 uppercase tracking-tight">
                          Expected
                        </div>
                        <pre className="text-sm font-mono text-brand-success whitespace-pre-wrap break-words">
                          {JSON.stringify(result.expected, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.output !== undefined && (
                      <div className="p-3 rounded-md bg-brand-error/10 border border-brand-error/30">
                        <div className="text-xs font-medium text-brand-error mb-2 uppercase tracking-tight">
                          Actual
                        </div>
                        <pre className="text-sm font-mono text-brand-error whitespace-pre-wrap break-words">
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Hidden Tests Summary */}
        {totalHiddenTests > 0 && (
          <div className="px-4 py-3 flex items-center gap-3 bg-workspace-elevated">
            <div
              className={cn(
                'h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                hiddenTestsPassed === totalHiddenTests
                  ? 'bg-brand-success text-workspace-text'
                  : 'bg-workspace-muted text-workspace-background',
              )}
            >
              ?
            </div>
            <span className="text-sm text-workspace-muted">
              {hiddenTestsPassed}/{totalHiddenTests} hidden tests passed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestResults;
