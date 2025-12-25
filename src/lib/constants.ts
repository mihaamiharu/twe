export const tierLabels: Record<string, { name: string; color: string; tier: string }> = {
    basic: { name: '🟢 Basic', color: 'text-emerald-400', tier: 'basic' },
    beginner: { name: '🟡 Beginner', color: 'text-yellow-400/90', tier: 'beginner' },
    intermediate: { name: '🟠 Intermediate', color: 'text-orange-400/90', tier: 'intermediate' },
    expert: { name: '🔴 Expert', color: 'text-red-400/90', tier: 'expert' },
};

export const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-500/10 text-green-300 border border-green-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20',
    HARD: 'bg-red-500/10 text-red-300 border border-red-500/20',
};

export const categoryLabels: Record<string, string> = {
    // Tier 1: Basic (Selectors)
    'css-basics': '📘 CSS Basics',
    'xpath-basics': '📒 XPath Basics',
    'xpath-advanced': '🚀 XPath Advanced',
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

// Define display order for categories within each tier
export const CATEGORY_ORDER: Record<string, number> = {
    // Basic Tier (in desired display order)
    'css-basics': 1,
    'xpath-basics': 2,
    'xpath-advanced': 3,
    'selector-comparison': 4,
    // Beginner Tier
    'javascript': 1,
    'dom': 2,
    'async-await': 3,
    // Intermediate Tier
    'playwright-navigation': 1,
    'playwright-locators': 2,
    'playwright-assertions': 3,
    'playwright-waits': 4,
    // Expert Tier
    'playwright-pom': 1,
    'playwright-data-driven': 2,
    'playwright-advanced': 3,
};
