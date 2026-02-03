export const tierLabels: Record<
  string,
  { name: string; color: string; tier: string }
> = {
  basic: { name: '🟢 Basic', color: 'text-emerald-400', tier: 'basic' },
  beginner: {
    name: '🟡 Beginner',
    color: 'text-yellow-400/90',
    tier: 'beginner',
  },
  intermediate: {
    name: '🟠 Intermediate',
    color: 'text-orange-400/90',
    tier: 'intermediate',
  },
  e2e: { name: '🟣 E2E Testing', color: 'text-purple-400/90', tier: 'e2e' },
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
  // Tier 2: Beginner (JavaScript & TypeScript)
  'js-fundamentals': '📒 JavaScript Fundamentals',
  'js-dom': '📓 DOM Basics',
  'js-async': '📔 Async Basics',
  'ts-fundamentals': '📘 TypeScript Fundamentals',
  // Tier 3: Intermediate (Playwright Core)
  'playwright-navigation': '🎭 Navigation & Actions',
  'playwright-locators': '🔍 Locators',
  'playwright-assertions': '✅ Assertions',
  'playwright-waits': '⏳ Wait Strategies',
  // Tier 4: E2E Testing (App Testing)
  'e2e-pom': '🏗️ Page Object Model',
  'e2e-integration': '🔄 Integration Patterns',
  'playwright-data-driven': '📊 Data-Driven Testing',
  'playwright-infrastructure': '🔧 Test Infrastructure',
};

export function getTierFromCategory(category?: string): string {
  if (!category) return 'basic';
  if (
    category.startsWith('css-') ||
    category.startsWith('xpath-') ||
    category.startsWith('selector')
  )
    return 'basic';
  if (category.startsWith('js-') || category.startsWith('ts-')) return 'beginner';
  if (
    category.startsWith('playwright-navigation') ||
    category.startsWith('playwright-locators') ||
    category.startsWith('playwright-assertions') ||
    category.startsWith('playwright-waits')
  )
    return 'intermediate';
  if (
    category.startsWith('playwright-data') ||
    category.startsWith('playwright-infrastructure') ||
    category.startsWith('e2e-')
  )
    return 'e2e';
  return 'basic';
}

export const TIER_ORDER = ['basic', 'beginner', 'intermediate', 'e2e'];
export const DIFFICULTY_ORDER = { EASY: 1, MEDIUM: 2, HARD: 3 };

// Define display order for categories within each tier
export const CATEGORY_ORDER: Record<string, number> = {
  // Basic Tier (Selectors) - Order base: 1000
  'css-basics': 1,
  'xpath-basics': 2,
  'xpath-advanced': 3,
  'selector-comparison': 4,
  // Beginner Tier (JS/TS) - Order base: 2000
  'js-fundamentals': 1,
  'js-dom': 2,
  'js-async': 3,
  'ts-fundamentals': 4,
  // Intermediate Tier (Playwright Core) - Order base: 3000
  'playwright-navigation': 1,
  'playwright-locators': 2,
  'playwright-assertions': 3,
  'playwright-waits': 4,
  // E2E Tier (App Testing) - Order base: 4000
  'e2e-pom': 1,
  'e2e-integration': 2,
  'playwright-data-driven': 3,
  'playwright-infrastructure': 4,
};
