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

    console.log('[AI Debug] System Prompt:', systemPrompt);
    console.log('[AI Debug] User Prompt:', userPrompt);

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
        ? `Kamu adalah mentor QA teknis yang membantu siswa belajar ${challengeType.replace('_', ' ')} untuk web testing.

Aturan PENTING:
1. JANGAN PERNAH memberikan solusi lengkap (copy-paste solution).
2. Analisis 'User Attempt' mereka. Tunjukkan secara spesifik bagian mana yang salah atau kurang (misalnya: "Kamu lupa menutup kurung", "Method .push() belum dipanggil").
3. Berikan contoh sintaks yang mirip tapi jangan gunakan nama variabel dari soal.
4. Jangan basa-basi ("Hebat sekali", "Kamu sudah berusaha"). Langsung ke poin teknis.
5. Jaga respons tetap singkat dan padat (maksimal 3 kalimat).
6. WAJIB sertakan contoh coding dalam blok kode (\`\`\`javascript ... \`\`\`).`
        : `You are a technical QA mentor helping a student learn ${challengeType.replace('_', ' ')} for web testing.

IMPORTANT Rules:
1. NEVER give the exact copy-paste solution.
2. Analyze their 'User Attempt'. Point out specific syntax errors or missing logic (e.g., "You forgot the closing bracket", "The .push() method needs an argument").
3. Provide a syntax example that is consistent with the problem but uses different variable names.
4. Skip the fluff ("Great job", "You're close"). Go straight to the technical point.
5. Keep it concise (max 3 sentences).
6. ALWAYS include a coding example in a code block (\`\`\`javascript ... \`\`\`).`;

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
