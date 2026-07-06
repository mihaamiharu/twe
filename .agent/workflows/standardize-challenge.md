---
description: Standardize a coding challenge (HTML, Instructions, Translation, Starter Code)
---

1. **Read the Challenge File**
   - Use `view_file` to read the target JSON file (e.g., `content/challenges/typescript.json`).

2. **Identify Target Challenge**
   - Locate the challenge object by its `slug`.

3. **Enhance Content (Structure & Tone)**
   - **`htmlContent`**: Add a visualization div (e.g., `<div class="test-runner">...</div>`).
   - **`starterCode`**: Standardize to the numbered comment format:

     ```javascript
     // 1. [Step Description]
     // Your code here
     ```

   - **`instructions` (EN)**:
     - Add a **Table** (e.g., "Common Types", "Examples").
     - Add a **"Real World Scenario"** section.
     - Add a **"Pro Tip"** blockquote if applicable.
   - **`instructions` (ID)**:
     - **Tone**: "Friendly Mentor" (use "Kamu", never "Anda").
     - **Headers**: Use "Skenario Dunia Nyata" and "Tugas Kamu".
     - **Translation**: Keep technical terms in English (Tier 1), translate verbs naturally (Tier 3).

4. **Apply Changes**
   - Use `replace_file_content` to update the specific challenge object.

5. **Sync Database**
   // turbo
   Run `bun run db:sync` to apply changes to the local database.
