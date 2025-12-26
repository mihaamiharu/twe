
import { KNOWN_SOLUTIONS } from '../../tests/fixtures/solutions';

export const ALL_SOLUTIONS: Record<string, string> = {
    ...KNOWN_SOLUTIONS,

    // ==========================================
    // CSS Selector Challenges (Basic Tier)
    // ==========================================
    'css-selector-101-id-class': '#login-btn',
    'css-tag-selectors': 'p',
    'css-combining-basics': 'div.error',
    'css-foundations-boss': 'button.btn.primary.large',
    'css-child-descendant': '.nav-menu > li',
    'css-sibling-selectors': 'h1 + p',
    'css-family-drill': '.profile-card .card-content span',
    'css-navigation-boss': '#user-menu .dropdown-list .action-item a',
    'css-attribute-selectors': '[type="email"]',
    'css-validation-states': 'input:invalid',
    'css-functional-pseudo': '.user-card.active:not(.suspended)',
    'css-forms-boss': 'input[type="tel"]:optional:not(:disabled)',
    'css-nth-child': 'li:nth-child(3)',
    'css-nth-type-vs-child': 'p:nth-of-type(2)',
    'css-table-drill': 'tbody tr:nth-child(2) td:nth-child(3)',
    'css-table-boss': 'tr:nth-child(odd) td:last-child button',
    'css-dynamic-elements': 'li:nth-child(2) .del',

    // ==========================================
    // XPath Challenges (Basic Tier)
    // ==========================================
    'xpath-basics-101': '//button',
    'xpath-attribute-matching': '//input[@type="password"]',
    'xpath-text-content': '//button[text()="Add to Cart"]',
    'xpath-contains-starts-with': '//div[contains(@class, "error")]',
    'xpath-fundamentals-boss': '//form[contains(@class, "login")]//button[text()="Sign In"]',
    'xpath-parent-ancestor': '//a[text()="Settings"]/parent::li',
    'xpath-following-sibling': '//label[text()="Username"]/following-sibling::input',
    'xpath-preceding-sibling': '//span[@class="error"]/preceding-sibling::label',
    'xpath-traversal-boss': '//span[text()="Invalid email format"]/ancestor::div//input',
    'xpath-multiple-conditions': '//button[@type="submit" and contains(@class, "primary")]',
    'xpath-position-indexing': '//ul/li[last()]',
    'xpath-normalize-space': '//button[normalize-space()="Save Changes"]',
    'xpath-complex-table': '//tr[td[text()="ORD-002"]]/td[4]',
    'xpath-axes-master': '//h3[text()="Product A"]/following::button[text()="Edit"][1]',
    'xpath-advanced-boss': '//tr[td[text()="John Doe"] and td[text()="Admin"]]//button[text()="Delete"]',

    // ==========================================
    // Comparison Challenges (Basic Tier)
    // ==========================================
    'selector-comparison-same-element': '#search-btn',
    'selector-when-xpath-wins': '//div[contains(@class, "product-card") and .//text()[contains(., "Out of Stock")]]',
    'selector-performance': '#submit-btn',
    'selector-comparison-boss': '[data-product-id="prod-101"] .remove',
};
