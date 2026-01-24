---
trigger: manual
description: Indonesian Localization guideline
---

# Agent Guideline: Technical QA & Test Engineering Translation (EN to ID)

## 1. Core Philosophy: The "Friendly Mentor"

The tone should be **educational, encouraging, yet technically precise**. We are guiding the user through a learning journey. Use **"Kamu"** to address the user, creating a personal connection similar to a senior engineer mentoring a junior.

## 2. Terminology & Localization Strategy

In Technical QA, clarity beats "pure" language. Follow this tiered approach:

- **Tier 1: Industry Standards (Keep in English)**
  - *Keep these in English (no italics needed for common terms):* Bug, Deploy, Automation, Repository, Branch, Merge Request, Environment, Framework, Assertion, Locator, Flaky, Edge Case, Array, Object, Loop, Function, Variable.

- **Tier 2: UI & Action Elements (Bold & Match Source)**
  - Always match the software's UI. If the tool is in English, keep the button/menu names in English.
  - *Example: "Klik tombol **Submit**."*

- **Tier 3: Technical Verbs (Natural Indonesian)**
  - *Examples:*
    - "Store" -> "Simpan"
    - "Create" -> "Buat"
    - "Return" -> "Mengembalikan"
    - "Call" -> "Panggil"
    - "Assign" -> "Set" or "Berikan nilai"
    - "Check/Verify" -> "Cek" or "Verifikasi"

## 3. Structural Standards

Consistency is key.

### A. Headers

- **"Real World Scenario"** -> **"Skenario Dunia Nyata"**
- **"Your Task"** -> **"Tugas Kamu"**

### B. Tone & Style

- **Address User:** Use **"Kamu"** (You). Avoid "Anda".
- **Code References:** Use backticks for variables and code values.
- **Direct & Active:** "Buat fungsi..." (Create a function...) instead of "Fungsi harus dibuat..."

## 4. Tone Adjustment Table

| English Pattern | Robotic/Formal ID | **Friendly Mentor ID (Preferred)** |
| :--- | :--- | :--- |
| "You must verify..." | "Anda harus memverifikasi..." | "Kamu perlu memverifikasi..." |
| "This helps prevent bugs." | "Ini membantu mencegah kutu." | "Ini membantu mencegah **bug**." |
| "Store the result in..." | "Simpan hasil di..." | "Simpan hasilnya di dalam..." |
| "It returns a string." | "Ia mengembalikan string." | "Fungsi ini mengembalikan **string**." |

## 5. Visual Scannability Rules

QA engineers scan for data points. Use Markdown effectively:

- **Bold** for critical outcomes and UI elements.
- `Inline code` for parameters, endpoints, or error codes.
- > **Penting/Catatan:** Use blockquotes for "gotchas" or common pitfalls in the testing environment.

## 6. Final Quality Checklist

- [ ] **Consistency:** Does it use "Kamu" and "Tugas Kamu"?
- [ ] **Flow:** Does it read like a natural tutorial?
- [ ] **Accuracy:** Are technical terms (English) preserved correctly?
- [ ] **Structure:** Are the standard headers used?

---

**This is now a complete guideline for a Technical QA audience. Would you like to test this by providing a short English QA tutorial snippet for me to translate as an example?**
