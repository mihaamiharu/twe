import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const getClient = () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

export interface HintRequest {
    challengeType: 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'PLAYWRIGHT' | 'JAVASCRIPT';
    instructions: string;
    htmlContent?: string;
    userAttempt?: string;
    locale?: string;
}

export interface HintResponse {
    success: boolean;
    hint?: string;
    error?: string;
}

/**
 * Generate an AI hint for a challenge using Gemini 2.0 Flash-Lite.
 * The hint guides the user without revealing the exact solution.
 */
export async function generateHint(request: HintRequest): Promise<HintResponse> {
    const { challengeType, instructions, htmlContent, userAttempt, locale = 'en' } = request;

    const client = getClient();
    if (!client) {
        return {
            success: false,
            error: 'AI hints are not configured. Please contact support.',
        };
    }

    const systemPrompt = getSystemPrompt(challengeType, locale);
    const userPrompt = buildUserPrompt(instructions, htmlContent, userAttempt, locale);

    try {
        const model = client.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            systemInstruction: systemPrompt,
        });

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 15000);
        });

        const generatePromise = model.generateContent(userPrompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);

        const response = result.response;
        const hint = response.text()?.trim();

        if (!hint) {
            return {
                success: false,
                error: 'Unable to generate hint. Please try again.',
            };
        }

        return {
            success: true,
            hint,
        };
    } catch (error) {
        console.error('[AI Hint] Error generating hint:', error);

        // Check for rate limit errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
            return {
                success: false,
                error: 'AI service is busy. Please try again in a minute.',
            };
        }

        if (errorMessage.includes('timed out')) {
            return {
                success: false,
                error: 'Request timed out. Please try again.',
            };
        }

        return {
            success: false,
            error: 'Failed to generate hint. Please try again later.',
        };
    }
}

function getSystemPrompt(challengeType: string, locale: string): string {
    const isIndonesian = locale === 'id';

    const basePrompt = isIndonesian
        ? `Kamu adalah mentor QA yang ramah dan berpengalaman, membantu siswa belajar ${challengeType.replace('_', ' ')} untuk web testing.

Aturan PENTING:
1. JANGAN PERNAH memberikan solusi atau selector yang tepat
2. Berikan petunjuk konseptual yang mengarahkan siswa ke teknik yang benar
3. Jelaskan MENGAPA pendekatan tertentu bekerja, bukan APA persisnya yang harus ditulis
4. Bersikap mendorong dan positif
5. Jaga agar respons tetap singkat (2-4 kalimat maksimal)
6. Jika siswa sudah mencoba sesuatu, akui usahanya dan arahkan ke pendekatan yang lebih baik`
        : `You are a friendly and experienced QA mentor helping a student learn ${challengeType.replace('_', ' ')} for web testing.

IMPORTANT rules:
1. NEVER give away the exact solution or selector
2. Provide conceptual hints that guide the student toward the right technique
3. Explain WHY a certain approach works, not WHAT exactly to type
4. Be encouraging and positive
5. Keep responses brief (2-4 sentences maximum)
6. If the student has tried something, acknowledge their effort and guide them toward a better approach`;

    return basePrompt;
}

function buildUserPrompt(
    instructions: string,
    htmlContent?: string,
    userAttempt?: string,
    locale?: string
): string {
    const isIndonesian = locale === 'id';

    let prompt = isIndonesian
        ? `## Instruksi Tantangan\n${instructions}\n`
        : `## Challenge Instructions\n${instructions}\n`;

    if (htmlContent) {
        prompt += isIndonesian
            ? `\n## Konten HTML\n\`\`\`html\n${htmlContent.slice(0, 1500)}\n\`\`\`\n`
            : `\n## HTML Content\n\`\`\`html\n${htmlContent.slice(0, 1500)}\n\`\`\`\n`;
    }

    if (userAttempt && userAttempt.trim()) {
        prompt += isIndonesian
            ? `\n## Percobaan Siswa\n\`\`\`\n${userAttempt}\n\`\`\`\n\nSiswa sudah mencoba ini tapi belum berhasil. Bantu mereka pahami apa yang perlu diperbaiki tanpa memberikan jawabannya.`
            : `\n## Student's Attempt\n\`\`\`\n${userAttempt}\n\`\`\`\n\nThe student tried this but it didn't work. Help them understand what to adjust without giving away the answer.`;
    } else {
        prompt += isIndonesian
            ? `\nSiswa belum mencoba apa-apa. Berikan petunjuk umum tentang teknik apa yang harus mereka eksplorasi.`
            : `\nThe student hasn't tried anything yet. Give them a general hint about what technique they should explore.`;
    }

    return prompt;
}
