export const tierLabels: Record<string, { name: string; color: string; tier: string }> = {
    basic: { name: '🟢 Basic', color: 'text-green-400', tier: 'basic' },
    beginner: { name: '🟡 Beginner', color: 'text-yellow-400', tier: 'beginner' },
    intermediate: { name: '🟠 Intermediate', color: 'text-orange-400', tier: 'intermediate' },
    expert: { name: '🔴 Expert', color: 'text-red-400', tier: 'expert' },
};

export const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-500/20 text-green-400',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    HARD: 'bg-red-500/20 text-red-400',
};

export const categoryLabels: Record<string, string> = {
    // Tier 1: Basic (Selectors)
    'css-basics': '📘 CSS Basics',
    'xpath-basics': '📙 XPath Basics',
    'selector-comparison': '📗 CSS vs XPath',
    // Tier 2: Beginner (JavaScript)
    'javascript': '📒 JavaScript Fundamentals',
    'dom': '📓 DOM Understanding',
    'async-await': '📔 Async/Await',
    // Tier 3: Intermediate (Playwright Basics)
    'playwright-navigation': '🎭 Navigation & Actions',
    'playwright-locators': '🔍 Locators',
    'playwright-assertions': '✅ Assertions',
    'playwright-waits': '⏳ Wait Strategies',
    // Tier 4: Expert (Advanced)
    'playwright-pom': '🏗️ Page Object Model',
    'playwright-data-driven': '📊 Data-Driven Testing',
    'playwright-advanced': '🚀 Advanced Patterns',
};

export function getTierFromCategory(category?: string): string {
    if (!category) return 'basic';
    if (category.startsWith('css-') || category.startsWith('xpath-') || category.startsWith('selector')) return 'basic';
    if (category.startsWith('javascript') || category.startsWith('dom') || category.startsWith('async-await')) return 'beginner';
    if (category.startsWith('playwright-navigation') || category.startsWith('playwright-locators') ||
        category.startsWith('playwright-assertions') || category.startsWith('playwright-waits')) return 'intermediate';
    if (category.startsWith('playwright-pom') || category.startsWith('playwright-data') ||
        category.startsWith('playwright-advanced')) return 'expert';
    return 'basic';
}

export const TIER_ORDER = ['basic', 'beginner', 'intermediate', 'expert'];
export const DIFFICULTY_ORDER = { EASY: 1, MEDIUM: 2, HARD: 3 };
