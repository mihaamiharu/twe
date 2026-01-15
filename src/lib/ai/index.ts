import OpenAI from 'openai';

// Initialize OpenAI client for DeepSeek
const getClient = () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey,
    });
};

export interface HintRequest {
    challengeType: 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'PLAYWRIGHT' | 'JAVASCRIPT';
    instructions: string;
    htmlContent?: string;
    starterCode?: string;
    userAttempt?: string;
    locale?: string;
}

export interface HintResponse {
    success: boolean;
    hint?: string;
    error?: string;
}

/**
 * Generate an AI hint for a challenge using DeepSeek Chat (V3).
 * The hint guides the user without revealing the exact solution.
 */
export async function generateHint(request: HintRequest): Promise<HintResponse> {
    const { challengeType, instructions, htmlContent, starterCode, userAttempt, locale = 'en' } = request;

    const client = getClient();
    if (!client) {
        return {
            success: false,
            error: 'AI hints are not configured. Please contact support.',
        };
    }

    // Optimization: Keep system prompt static for DeepSeek caching. 
    // Pass 'challengeType' to user prompt instead.
    const systemPrompt = getSystemPrompt(locale);
    const userPrompt = buildUserPrompt(challengeType, instructions, htmlContent, starterCode, userAttempt, locale);

    console.log('[AI Debug] System Prompt:', systemPrompt);
    console.log('[AI Debug] User Prompt:', userPrompt);

    try {
        const completion = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            // DeepSeek specific parameters if any needed, usually standard OpenAI params work
            temperature: 0.7,
            max_tokens: 1024,
        });

        const hint = completion.choices[0].message.content?.trim();

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
    } catch (error: unknown) {
        console.error('[AI Hint] Error generating hint:', error);

        // Specific DeepSeek/OpenAI error handling
        const errorMessage = error instanceof Error ? error.message : String(error);
        const status = (error as { status?: number; response?: { status?: number } })?.status
            || (error as { status?: number; response?: { status?: number } })?.response?.status; // Check for HTTP status code if available

        if (status === 401) {
            return {
                success: false,
                error: 'AI authentication failed. Please check configuration.',
            };
        }

        if (status === 402) {
            return {
                success: false,
                error: 'AI service PI balance is exhausted. Hints are temporarily unavailable.',
            };
        }

        if (status === 429 || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
            return {
                success: false,
                error: 'AI service is busy, please try again.',
            };
        }

        if (errorMessage.includes('timed out')) {
            return {
                success: false,
                error: 'Request timed out. Please try again.',
            };
        }

        // Generic 5xx or other errors
        if (status && status >= 500) {
            return {
                success: false,
                error: 'AI service unavailable. Please try again later.',
            };
        }

        return {
            success: false,
            error: 'Failed to generate hint. Please try again later.',
        };
    }
}

function getSystemPrompt(locale: string): string {
    const isIndonesian = locale === 'id';

    // STATIC PROMPT - Do not include dynamic variables here to maximize DeepSeek caching
    const basePrompt = isIndonesian
        ? `Kamu adalah mentor QA teknis yang membantu siswa belajar web testing.

Aturan PENTING:
1. JANGAN PERNAH memberikan solusi lengkap (copy-paste solution).
2. Analisis 'User Attempt' mereka. Tunjukkan secara spesifik bagian mana yang salah atau kurang (misalnya: "Kamu lupa menutup kurung", "Method .push() belum dipanggil").
3. Berikan contoh sintaks yang mirip tapi jangan gunakan nama variabel dari soal.
4. Jangan basa-basi ("Hebat sekali", "Kamu sudah berusaha"). Langsung ke poin teknis.
5. Jaga respons tetap singkat dan padat (maksimal 3 kalimat).
6. Sertakan contoh coding singkat atau pola sintaks jika membantu memperjelas solusi.`
        : `You are a technical QA mentor helping a student learn web testing.

IMPORTANT Rules:
1. NEVER give the exact copy-paste solution.
2. Analyze their 'User Attempt'. Point out specific syntax errors or missing logic (e.g., "You forgot the closing bracket", "The .push() method needs an argument").
3. Provide a syntax example that is consistent with the problem but uses different variable names.
4. Skip the fluff ("Great job", "You're close"). Go straight to the technical point.
5. Keep it concise (max 3 sentences).
6. Include a brief code example or pattern if it helps clarify the solution.`;

    return basePrompt;
}

function buildUserPrompt(
    challengeType: string,
    instructions: string,
    htmlContent?: string,
    starterCode?: string,
    userAttempt?: string,
    locale?: string
): string {
    const isIndonesian = locale === 'id';
    const readableType = challengeType.replace('_', ' ');

    // Start with Context to establish what we are testing (formerly in system prompt)
    let prompt = isIndonesian
        ? `Konteks: Tantangan ${readableType}.\n\n`
        : `Context: ${readableType} Challenge.\n\n`;

    prompt += isIndonesian
        ? `## Instruksi Tantangan\n${instructions}\n`
        : `## Challenge Instructions\n${instructions}\n`;

    if (htmlContent) {
        prompt += isIndonesian
            ? `\n## Konten HTML\n\`\`\`html\n${htmlContent.slice(0, 1500)}\n\`\`\`\n`
            : `\n## HTML Content\n\`\`\`html\n${htmlContent.slice(0, 1500)}\n\`\`\`\n`;
    }

    // Optimization: Treat starter code as "no attempt" to get general guidance
    // Normalize by stripping whitespace for loose comparison
    const normalizedAttempt = userAttempt?.trim() || '';
    const normalizedStarter = starterCode?.trim() || '';
    const isStarterCode = normalizedAttempt === normalizedStarter;

    if (normalizedAttempt && !isStarterCode) {
        prompt += isIndonesian
            ? `\n## Percobaan Siswa\n\`\`\`\n${userAttempt}\n\`\`\`\n\nSiswa sudah mencoba ini tapi belum berhasil. Bantu mereka pahami apa yang perlu diperbaiki tanpa memberikan jawabannya.`
            : `\n## Student's Attempt\n\`\`\`\n${userAttempt}\n\`\`\`\n\nThe student tried this but it didn't work. Help them understand what to adjust without giving away the answer.`;
    } else {
        prompt += isIndonesian
            ? `\nSiswa belum melakukan perubahan signifikan pada kode awal. Berikan petunjuk umum tentang teknik apa yang harus mereka eksplorasi.`
            : `\nThe student hasn't made significant changes to the starter code yet. Give them a general hint about what technique they should explore.`;
    }

    return prompt;
}
