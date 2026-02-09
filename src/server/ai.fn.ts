import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from './auth.mw';

// ----------------------------------------------------------------------------
// AI HINT GENERATION
// ----------------------------------------------------------------------------

const GetHintSchema = z.object({
    challengeSlug: z.string().min(1),
    userAttempt: z.string().optional(),
    locale: z.string().default('en'),
});

export const getAIHint = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator((data: unknown) => GetHintSchema.parse(data))
    .handler(async ({ data, context }) => {
        const { challengeSlug, userAttempt, locale = 'en' } = data;

        // Dynamically import server-only modules
        const { db } = await import('@/db');
        const { progress, challenges } = await import('@/db/schema');
        const { eq, and } = await import('drizzle-orm');
        const { logger } = await import('@/lib/logger');
        const { generateHint } = await import('@/lib/ai');
        const { getChallengeContent } = await import('./content.server');

        try {
            // 1. Check auth verified by middleware
            const userId = context.user.id;

            // 2. Get challenge from DB (to get the ID)
            const challenge = await db.query.challenges.findFirst({
                where: eq(challenges.slug, challengeSlug),
            });

            // 3. Get challenge content from filesystem (for instructions/html)
            const challengeContent = await getChallengeContent(challengeSlug, locale);

            if (!challengeContent) {
                return {
                    success: false,
                    error: locale === 'id'
                        ? 'Tantangan tidak ditemukan'
                        : 'Challenge not found',
                };
            }

            // 4. Check if user already used hint for this challenge
            let userProgress = null;
            if (challenge) {
                userProgress = await db.query.progress.findFirst({
                    where: and(
                        eq(progress.userId, userId),
                        eq(progress.challengeId, challenge.id)
                    ),
                });
            }

            // Return stored hint if available
            if (userProgress?.usedHint && userProgress?.hintContent) {
                return {
                    success: true,
                    hint: userProgress.hintContent,
                    // No penalty warning needed as it's already used
                };
            }

            if (userProgress?.usedHint) {
                // Fallback: If marked used but no content (legacy), regenerate but warn it's "recovering"
                // Or just let it regenerate.
                // Current logic was preventing re-generation. Let's allow regeneration if content is missing,
                // but we won't charge them again (already marked used).
                // Actually, let's just proceed to generation but update the record instead of blocking.
            }

            // 5. Generate hint using Deepseek API
            logger.info(`[AI Hint] Generating hint for challenge: ${challengeSlug}, user: ${userId}`);

            const hintResult = await generateHint({
                challengeType: challengeContent.type as 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'PLAYWRIGHT' | 'JAVASCRIPT',
                instructions: challengeContent.instructions,
                htmlContent: challengeContent.htmlContent,
                starterCode: challengeContent.starterCode,
                userAttempt,
                locale,
            });

            if (!hintResult.success) {
                logger.error(`[AI Hint] Failed to generate hint: ${hintResult.error}`);
                return {
                    success: false,
                    error: hintResult.error,
                };
            }

            // 6. Mark hint as used in progress table AND store content
            if (challenge) {
                if (userProgress) {
                    await db
                        .update(progress)
                        .set({
                            usedHint: true,
                            hintContent: hintResult.hint,
                            updatedAt: new Date(),
                        })
                        .where(eq(progress.id, userProgress.id));
                } else {
                    // Create new progress record with hint marked as used
                    await db.insert(progress).values({
                        userId,
                        challengeId: challenge.id,
                        usedHint: true,
                        hintContent: hintResult.hint,
                        lastAccessedAt: new Date(),
                    });
                }
            }

            logger.info(`[AI Hint] Successfully generated hint for user: ${userId}`);

            return {
                success: true,
                hint: hintResult.hint,
                xpPenaltyWarning: locale === 'id'
                    ? 'XP yang kamu dapat akan dikurangi 50% karena menggunakan petunjuk'
                    : 'Your XP reward will be reduced by 50% for using a hint',
            };

        } catch (error) {
            logger.error('[AI Hint] Error:', error);
            return {
                success: false,
                error: locale === 'id'
                    ? 'Gagal menghasilkan petunjuk. Silakan coba lagi.'
                    : 'Failed to generate hint. Please try again.',
            };
        }
    });
