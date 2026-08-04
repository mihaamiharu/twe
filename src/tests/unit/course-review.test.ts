import { describe, expect, it } from 'bun:test';
import {
  buildCourseReviewSystemPrompt,
  buildCourseReviewUserPrompt,
  createCourseReviewInputSchema,
  parseCourseReviewDraftOutput,
  courseReviewDraftMapSchema,
} from '@/lib/course-review';

describe('private course review contract', () => {
  it('accepts only HTTPS GitHub repository URLs', () => {
    expect(
      createCourseReviewInputSchema.parse({
        courseSlug: 'ai-assisted-qa-workflow',
        repositoryUrl: 'https://github.com/learner/qa-workflow',
      }).reviewRound,
    ).toBe(1);

    expect(() =>
      createCourseReviewInputSchema.parse({
        courseSlug: 'ai-assisted-qa-workflow',
        repositoryUrl: 'http://github.com/learner/qa-workflow',
      }),
    ).toThrow();

    expect(() =>
      createCourseReviewInputSchema.parse({
        courseSlug: 'ai-assisted-qa-workflow',
        repositoryUrl: 'https://example.com/learner/qa-workflow',
      }),
    ).toThrow();
  });

  it('builds a rubric-aligned prompt with selected files and private notes', () => {
    const prompt = buildCourseReviewUserPrompt({
      checkpointSlug: '06-triage',
      locale: 'id',
      reviewerNotes: 'Check whether the classification is evidence-backed.',
      files: [
        {
          path: 'docs/reports/failure-analysis.md',
          content: 'Primary classification: test issue',
        },
      ],
    });

    expect(prompt).toContain('06-triage');
    expect(prompt).toContain('failure-analysis.md');
    expect(prompt).toContain('evidence-backed');
    expect(prompt).toContain('MEETS_EXPECTATIONS');
    expect(buildCourseReviewSystemPrompt('id')).toContain('DRAFT REVIEW');
  });

  it('parses fenced JSON into the structured review draft contract', () => {
    const draft = parseCourseReviewDraftOutput(`
      \`\`\`json
      {
        "checkpointSlug": "01-requirements",
        "status": "NEEDS_REVISION",
        "evidence": [{"path": "docs/requirements/requirements-notes.md", "location": "Risks", "observation": "Risk list is empty."}],
        "concerns": ["The risk analysis is incomplete."],
        "suggestions": ["Add at least one product and environment risk."],
        "confidence": "high",
        "uncertainty": [],
        "humanVerification": ["Confirm whether the learner inspected the acceptance criteria."]
      }
      \`\`\`
    `);

    expect(draft.status).toBe('NEEDS_REVISION');
    expect(draft.evidence[0]?.path).toBe(
      'docs/requirements/requirements-notes.md',
    );
  });

  it('requires stored review drafts to retain prompt version and timestamp', () => {
    const result = courseReviewDraftMapSchema.safeParse({
      '01-requirements': {
        checkpointSlug: '01-requirements',
        status: 'MEETS_EXPECTATIONS',
        evidence: [],
        concerns: [],
        suggestions: [],
        confidence: 'medium',
        uncertainty: [],
        humanVerification: [],
        promptVersion: 'course-review-v1',
        generatedAt: '2026-08-04T00:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);
  });
});
