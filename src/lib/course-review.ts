import { z } from 'zod';

export const COURSE_REVIEW_PROMPT_VERSION = 'course-review-v1' as const;
export const COURSE_REVIEW_MAX_FILES = 8;
export const COURSE_REVIEW_MAX_FILE_CHARS = 50_000;

const githubRepositoryUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        (url.hostname === 'github.com' || url.hostname === 'www.github.com') &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  }, 'Repository URL must be an HTTPS GitHub repository URL');

export const courseReviewFileSchema = z.object({
  path: z.string().trim().min(1).max(240),
  content: z.string().max(COURSE_REVIEW_MAX_FILE_CHARS),
});

export const courseReviewCheckpointStatusSchema = z.enum([
  'MEETS_EXPECTATIONS',
  'NEEDS_REVISION',
]);

export const courseReviewDraftSchema = z.object({
  checkpointSlug: z.string().min(1),
  status: courseReviewCheckpointStatusSchema,
  evidence: z.array(
    z.object({
      path: z.string().min(1),
      location: z.string().optional(),
      observation: z.string().min(1),
    }),
  ),
  concerns: z.array(z.string().min(1)),
  suggestions: z.array(z.string().min(1)),
  confidence: z.enum(['high', 'medium', 'low']),
  uncertainty: z.array(z.string().min(1)),
  humanVerification: z.array(z.string().min(1)),
});

export const courseReviewStoredDraftSchema = courseReviewDraftSchema.extend({
  promptVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
});

export const courseReviewDraftMapSchema = z.record(
  z.string(),
  courseReviewStoredDraftSchema,
);

export const createCourseReviewInputSchema = z.object({
  courseSlug: z.literal('ai-assisted-qa-workflow'),
  repositoryUrl: githubRepositoryUrlSchema,
  reviewRound: z.number().int().min(1).max(2).default(1),
  reviewerNotes: z.string().max(5_000).optional(),
});

export const generateCourseReviewDraftInputSchema = z.object({
  reviewId: z.string().uuid(),
  courseSlug: z.literal('ai-assisted-qa-workflow'),
  locale: z.enum(['id']),
  checkpointSlug: z.string().min(1),
  files: z.array(courseReviewFileSchema).min(1).max(COURSE_REVIEW_MAX_FILES),
  reviewerNotes: z.string().max(5_000).optional(),
});

export const updateCourseReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
  checkpointSlug: z.string().min(1),
  status: courseReviewCheckpointStatusSchema,
  reviewerNotes: z.string().max(5_000).optional(),
});

export const finalizeCourseReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
  finalFeedback: z.string().trim().min(1).max(20_000),
});

export type CourseReviewFile = z.infer<typeof courseReviewFileSchema>;
export type CourseReviewDraft = z.infer<typeof courseReviewDraftSchema>;
export type CourseReviewDraftMap = z.infer<typeof courseReviewDraftMapSchema>;
export type CourseReviewCheckpointStatus = z.infer<
  typeof courseReviewCheckpointStatusSchema
>;

export function buildCourseReviewSystemPrompt(locale: 'id' | 'en'): string {
  if (locale === 'id') {
    return `Kamu adalah reviewer QA senior yang membantu course owner menyiapkan draft review repository learner.

Aturan:
1. Berikan DRAFT REVIEW saja. Course owner akan memverifikasi dan menentukan keputusan akhir.
2. Gunakan rubric: MEETS_EXPECTATIONS atau NEEDS_REVISION.
3. Citing evidence wajib menggunakan path file, section, atau nomor baris bila tersedia.
4. Jangan menganggap test passed berarti kualitas produk pasti baik.
5. Bedakan reasoning QA dari kualitas kode Playwright.
6. Tandai klaim yang tidak dapat diverifikasi dari file yang diberikan.
7. Jangan mengarang file, output, requirement, atau hasil eksekusi.
8. Output HARUS berupa JSON yang sesuai schema yang diminta.

Jawab dalam Bahasa Indonesia.`;
  }

  return `You are a senior QA reviewer helping a course owner prepare a draft review of a learner repository.

Rules:
1. Produce a DRAFT REVIEW only. The course owner verifies it and makes the final decision.
2. Use the rubric: MEETS_EXPECTATIONS or NEEDS_REVISION.
3. Cite evidence with file paths, sections, or line numbers when available.
4. Never treat passing tests as proof that product quality is complete.
5. Separate QA reasoning quality from Playwright code quality.
6. Flag claims that cannot be verified from the supplied files.
7. Do not invent files, output, requirements, or execution results.
8. Output JSON matching the requested schema.

Answer in English.`;
}

export function buildCourseReviewUserPrompt(input: {
  checkpointSlug: string;
  files: readonly CourseReviewFile[];
  reviewerNotes?: string;
  locale: 'id' | 'en';
}): string {
  const fileSections = input.files
    .map((file) => `### FILE: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n');
  const rubric =
    input.locale === 'id'
      ? `Evaluasi checkpoint ${input.checkpointSlug} dengan rubric berikut:
- status: MEETS_EXPECTATIONS jika evidence cukup dan reasoning dapat dipertanggungjawabkan.
- status: NEEDS_REVISION jika evidence, reasoning, artifact, atau implementasi penting masih kurang.
- evidence: daftar observasi yang dapat diverifikasi.
- concerns: gap atau risiko.
- suggestions: perbaikan konkret.
- confidence: high, medium, atau low.
- uncertainty: hal yang belum dapat dibuktikan.
- humanVerification: pemeriksaan yang wajib dilakukan course owner.`
      : `Evaluate checkpoint ${input.checkpointSlug} with this rubric:
- status: MEETS_EXPECTATIONS when evidence is sufficient and reasoning is defensible.
- status: NEEDS_REVISION when important evidence, reasoning, artifacts, or implementation are missing.
- evidence: verifiable observations.
- concerns: gaps or risks.
- suggestions: concrete improvements.
- confidence: high, medium, or low.
- uncertainty: claims that cannot yet be proven.
- humanVerification: checks the course owner must perform.`;

  return `${rubric}

${input.reviewerNotes ? `Private reviewer context:\n${input.reviewerNotes}\n\n` : ''}Return one JSON object with these keys:
{
  "checkpointSlug": "${input.checkpointSlug}",
  "status": "MEETS_EXPECTATIONS" or "NEEDS_REVISION",
  "evidence": [{"path": "...", "location": "...", "observation": "..."}],
  "concerns": ["..."],
  "suggestions": ["..."],
  "confidence": "high" or "medium" or "low",
  "uncertainty": ["..."],
  "humanVerification": ["..."]
}

Learner files:
${fileSections}`;
}

export function parseCourseReviewDraftOutput(raw: string): CourseReviewDraft {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1] ?? raw;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  const json =
    firstBrace >= 0 && lastBrace > firstBrace
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;

  return courseReviewDraftSchema.parse(JSON.parse(json));
}
