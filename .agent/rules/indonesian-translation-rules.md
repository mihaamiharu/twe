---
trigger: manual
description: Indonesian Localization guideline
---

# Agent Guideline: Technical QA & Test Engineering Translation (EN to ID)

## 1. Core Philosophy: The "Precision Engineer"

The tone should be **authoritative, methodical, and objective**. We are not just translating a "how-to"; we are translating a **validation process**. The language must prioritize clarity to ensure reproducibility.

## 2. Terminology & Localization Strategy

In Technical QA, clarity beats "pure" language. Follow this tiered approach:

- **Tier 1: Industry Standards (Keep in English/Italicized)**
- _Examples: Bug, Deploy, Automation Script, Repository, Branch, Merge Request, Environment, Framework, Assertion, Locator, Flaky, Edge Case._

- **Tier 2: UI & Action Elements (Bold & Match Source)**
- Always match the software's UI. If the tool is in English, keep the button/menu names in English.
- _Example: "Buka menu **Settings** lalu klik **Run Test**."_

- **Tier 3: Technical Verbs (Indonesianized or Active)**
- _Examples: Eksekusi (Execute), Inisialisasi (Initialize), Konfigurasi (Configure), Verifikasi (Verify)._

## 3. Structural Standards for QA Content

### A. Procedural Precision

Avoid "flowery" transitions. Use direct, imperative commands.

- _English:_ "You might want to check the logs if it fails."
- _Natural Tech ID:_ "Cek log jika proses gagal." (More direct and efficient).

### B. The "Given-When-Then" Logic (Gherkin/BDD)

Even if not explicitly using Cucumber, maintain this logical flow in explanations:

- **Kondisi (Given):** Keadaan awal (e.g., "Pastikan server sudah jalan.")
- **Aksi (When):** Interaksi (e.g., "Kirim request POST ke endpoint...")
- **Ekspektasi (Then):** Hasil (e.g., "Response harus mengembalikan status `200 OK`.")

### C. Code & Variables

- **Never translate** code, CLI commands, or variable names.
- **Placeholders:** Use `<...>` or `[...]` and translate the intent inside (e.g., `git checkout <nama_branch>`).

## 4. Tone Adjustment Table

| English Pattern                    | Robotic/Generic ID                  | **Professional QA-Tech ID**                                                |
| ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| "This helps avoid regressions."    | "Ini membantu menghindari regresi." | "Ini meminimalisir risiko **regression** pada sistem."                     |
| "The test failed due to timeout."  | "Tes gagal karena waktu habis."     | "Test case **Fail** karena kendala **timeout**."                           |
| "Ensure the element is clickable." | "Pastikan elemen bisa diklik."      | "**Verifikasi** bahwa elemen tersebut sudah _interactable_ (bisa diklik)." |
| "Catching bugs early in the CI."   | "Menangkap bug awal di CI."         | "Mendeteksi **bug** lebih dini pada _pipeline_ CI."                        |

## 5. Visual Scannability Rules

QA engineers scan for data points. Use Markdown effectively:

- **Bold** for critical outcomes and UI elements.
- `Inline code` for parameters, endpoints, or error codes.
- > **Penting/Catatan:** Use blockquotes for "gotchas" or common pitfalls in the testing environment.

## 6. Final Quality Checklist

- [ ] **Reproducibility:** Can a junior QA follow this without asking for clarification?
- [ ] **No Ambiguity:** Are words like "mungkin" (maybe) or "sepertinya" (it seems) avoided in favor of definitive terms?
- [ ] **Professionalism:** Is it free from "Indoglish" grammar while still using standard tech terms?
- [ ] **Tool Accuracy:** Are specific tool terms (e.g., _Cypress commands, Selenium locators_) intact?

---

**This is now a complete guideline for a Technical QA audience. Would you like to test this by providing a short English QA tutorial snippet for me to translate as an example?**
