# TWE Learn Lesson Standard

**Status:** Working curriculum standard for the Web Automation redesign  
**Adopted:** 2026-08-25  
**Scope:** All English and Indonesian Learn lessons reviewed or written during the redesign

## How to use this standard

Before auditing, outlining, writing, translating, or approving each module:

1. Re-read this document.
2. Define the module and lesson outcomes before editing content.
3. Apply the required lesson structure below.
4. Use optional sections only when they improve learning.
5. Review the result against the lesson acceptance checklist.

This standard governs Learn content. Standalone Practice challenges have additional independence requirements described under Practice rules.

## 1. Core rule

> Every lesson must improve what a QA engineer can **explain, decide, do, review, or diagnose**.

If a lesson only adds syntax to memorize, it does not belong in Core Learn.

Each lesson should teach one primary capability and answer:

- Why does this matter for QA?
- How should the learner think about it?
- When should it be used?
- What does good implementation look like?
- How can it fail?
- How will the learner know they understood it?

## 2. Required lesson structure

### 2.1 Lesson promise

English:

```markdown
## After this lesson, you can
```

Indonesian:

```markdown
## Setelah lesson ini, kamu bisa
```

Include three to five observable outcomes.

Use verbs such as:

- Explain
- Choose
- Write
- Inspect
- Review
- Diagnose
- Fix
- Justify

Avoid vague outcomes such as:

- Understand
- Learn
- Know
- Become familiar with

### 2.2 Why this matters for QA

English:

```markdown
## Why this matters for QA
```

Indonesian:

```markdown
## Kenapa ini penting buat QA
```

Begin with a realistic QA problem, product risk, failure, or manual-testing situation.

The learner should immediately recognize:

- Where this appears at work
- Why it matters
- What could go wrong
- Why the lesson is worth their time

Indonesian lessons can open conversationally:

> Pernah nggak sih kamu menjalankan test case yang kelihatannya sederhana, tapi begitu mau di-automate malah muncul banyak pertanyaan?

### 2.3 Mental model

English:

```markdown
## The mental model
```

Indonesian:

```markdown
## Cara berpikir yang perlu kamu pegang
```

Explain the durable concept before introducing syntax.

This section should answer:

- What is happening?
- Why does it behave this way?
- What responsibilities are involved?
- What assumption commonly causes mistakes?

Use diagrams only when they materially improve the explanation.

### 2.4 Realistic worked example

English:

```markdown
## Work through a realistic example
```

Indonesian:

```markdown
## Coba kita bedah contoh nyata
```

Develop one primary example progressively:

```text
QA scenario
    ↓
Reasoning and decision
    ↓
Implementation
    ↓
Observable evidence
```

For technical lessons:

- Explain the testing intent before showing code.
- Connect important lines to the QA problem.
- Avoid disconnected syntax demonstrations.
- Use realistic names, data, state, and expected results.
- Show only the code needed for the capability being taught.

### 2.5 Decision guidance

English:

```markdown
## When to use it—and when not to
```

Indonesian:

```markdown
## Kapan pendekatan ini cocok dipakai?
```

Explain:

- Appropriate use cases
- Situations where it is unnecessary
- Relevant trade-offs
- More suitable alternatives
- Misleading shortcuts

A new technique must not be presented as the default answer to every problem.

### 2.6 Failure and debugging lens

English:

```markdown
## When it fails
```

Indonesian:

```markdown
## Kalau gagal, mulai cek dari mana?
```

Show at least one realistic failure:

1. What the learner observes
2. The likely cause
3. What evidence to inspect
4. How to fix the underlying cause
5. Which tempting workaround would only hide it

For conceptual lessons, the failure may be a flawed decision rather than broken code.

### 2.7 Check understanding

English:

```markdown
## Check your understanding
```

Indonesian:

```markdown
## Coba cek pemahamanmu
```

Every lesson gets a small checkpoint, but not necessarily a standalone Practice challenge.

Possible checkpoint formats:

- Review a scenario
- Choose and justify an approach
- Predict an outcome
- Find a problem in a code sample
- Diagnose a failure
- Improve a weak test
- Modify a small example

### 2.8 Compare reasoning

English:

```markdown
## Compare your reasoning
```

Indonesian:

```markdown
## Bandingkan dengan cara pikir ini
```

Provide a model response.

For judgment-based questions, use wording such as:

> One reasonable answer is…

Avoid implying that only one answer is valid when product context could change the decision.

### 2.9 Readiness check

English:

```markdown
## Before you continue
```

Indonesian:

```markdown
## Sebelum lanjut
```

State what the learner should now be able to do without copying the lesson.

Also explain how this capability prepares them for the next lesson.

## 3. Optional sections

Use only when they improve the lesson:

- Prerequisites
- Diagram
- Reference table
- Code walkthrough
- Guided exercise
- Core Practice
- Additional Practice
- Further reading

Not every lesson requires an image, AI-assisted review, or challenge.

### 3.1 AI-assisted work review

AI-assisted review is optional. Use it only when:

- AI-assisted work is already part of the lesson's scenario or workflow.
- The lesson teaches a specific risk that changes how learners should review that work.
- The guidance adds something beyond the lesson's ordinary QA review and debugging guidance.

The guidance may be:

- A dedicated section when AI use is an explicit part of the lesson.
- Integrated into **When it fails** when the relevant risk is a generated mistake or unsupported assumption.
- Integrated into **Check your understanding** when reviewing an AI-assisted proposal is a useful exercise.

If a dedicated section materially improves the lesson, use:

English:

```markdown
## Review AI-assisted work
```

Indonesian:

```markdown
## Review hasil kerja dengan bantuan AI
```

Do not:

- Add the section only to satisfy the lesson format.
- Introduce AI for the first time in an isolated review section.
- Repeat an existing checklist with only “AI-generated” added to it.
- Turn ordinary QA judgment into a separate AI rule.
- Use a generic checklist that could be pasted into every lesson unchanged.

Useful guidance should apply the lesson's actual capability. For example:

- Did AI invent product behavior, an API, test data, or a selector?
- Is a fixed wait hiding a synchronization problem?
- Does the assertion prove the stated product risk?
- Is a generated abstraction justified by a real maintenance need?
- Can the learner explain, debug, and maintain every important line?

These are examples, not a required checklist. AI-assisted work follows the same quality standard as human-written work.

## 4. Practice rules

### 4.1 In-lesson checkpoint

An in-lesson checkpoint may depend on context from the lesson.

It exists to help learners evaluate their reasoning and does not need automated grading.

### 4.2 Standalone Practice challenge

A standalone Practice challenge must:

- Explain its own scenario
- Provide everything needed to attempt it
- Remain usable without reading Learn
- Test the intended QA capability
- Avoid requiring unrelated syntax
- Contain accurate English and Indonesian instructions

### 4.3 Core Practice

Use Core Practice only when completing the module genuinely requires hands-on proof.

Core Practice blocks learning-path completion.

### 4.4 Additional Practice

Additional Practice provides repetition, variations, or optional depth.

Additional Practice never blocks completion.

## 5. Visual rules

Create or reuse a visual when it clarifies:

- Sequence
- State changes
- Hierarchy
- Decision relationships
- Architecture
- Failure flow

Avoid decorative images and diagrams that merely repeat the paragraph.

The default visual language is English. Indonesian lessons may reuse the same asset with:

- Indonesian alt text
- An Indonesian caption
- A short explanation of unfamiliar labels when needed

Visuals should be editable and maintainable. Prefer SVG for diagrams.

## 6. Bilingual rules

English and Indonesian lessons must preserve:

* The same learner outcomes
* The same mental model
* Equivalent technical depth
* The same example purpose
* Equivalent checkpoints
* The same readiness expectation

They do not need identical sentence structure or tone.

### 6.1 English voice

* Clear
* Direct
* Professional
* Conversational
* Free of unnecessary jargon

### 6.2 Indonesian voice

The voice should feel like:

> Seorang senior QA yang ngajak juniornya mikir bareng—santai, jelas, tapi tetap akurat.

Use:

* `kamu`, not `Anda`
* `nggak` consistently for casual sentences
* Conversational hooks such as:

  * “Pernah nggak sih…”
  * “Coba bayangin kalau…”
  * “Sekarang pertanyaannya…”
  * “Nah, masalahnya…”
  * “Dari sini mulai kelihatan…”
* Short and active sentences
* Familiar QA and engineering terminology when literal translation sounds unnatural or reduces precision
* Natural Indonesian for ordinary terms that do not need to remain in English
* Questions that invite learners to reason

Keep English technical terms selectively, not mechanically. A term should remain in English when it is already familiar in Indonesian QA or engineering usage, is likely to appear that way at work, or would lose precision when translated.

Keeping technical terminology in English does not mean preserving every English technical-sounding noun. Prefer natural Indonesian when the translated term is already familiar and clear.

Avoid:

* Excessive slang
* `gue/lo`
* Social-media expressions
* Jokes inside critical technical explanations
* Calling AI a “kuli”
* Inconsistent terminology
* Reducing technical precision for casualness
* Adding explanations or examples only to make the Indonesian version feel more conversational
* Unnecessary English-heavy sentences when natural Indonesian would be clearer

Conversational hooks should feel natural, not appear mechanically in every section.

## 7. Indonesian technical terminology rule

Keep established QA, engineering, and Playwright terminology in English when translating it would sound unnatural, reduce precision, or differ from the language Indonesian QA engineers are likely to encounter at work.

This commonly includes:

- `test`, `test case`, `test data`, `test suite`, and `test runner`
- `browser`, `browser context`, `state`, and `scope`
- `locator`, `assertion`, `fixture`, `hook`, `setup`, and `teardown`
- `retry`, `flaky`, `timeout`, `debugging`, and `root cause`
- `pipeline`, `workflow`, `job`, `runner`, and `merge gate`
- `report`, `artifact`, `trace`, and `log`
- `pull request`, `code review`, and `Playwright`

Never translate API names, code identifiers, configuration keys, command names, role names exposed by the product, or literal UI labels.

Write the explanation and sentence structure in natural, casual Indonesian around those terms. Keeping technical terminology does not mean turning every sentence into English or mixing languages without purpose.

Preferred:

> Kalau test mulai flaky di CI, buka trace dan runner log dari failed attempt pertama sebelum menambah retry.

Avoid a forced literal translation:

> Kalau pengujian mulai tidak stabil di integrasi berkelanjutan, buka jejak dan catatan pelaksana dari percobaan gagal pertama.

Also avoid unnecessary English-heavy prose:

> Try to check the trace from the first failed attempt untuk melakukan root cause analysis.

Explain an unfamiliar term at its first meaningful use using simple Indonesian context. Then keep the same term consistently across lessons, standalone Practice, registry copy, captions, and checkpoints.

Use a natural Indonesian term when it is already familiar and does not lose technical meaning. The goal is how Indonesian QA engineers actually communicate—not preserving English merely to sound technical.

## 8. Lesson acceptance checklist

A lesson is ready only when every relevant answer is yes:

- [ ] Does it teach one clear QA capability?
- [ ] Are its outcomes observable?
- [ ] Does the content fulfill every stated outcome?
- [ ] Does it begin with a realistic QA problem?
- [ ] Is the mental model explained before syntax?
- [ ] Is the example realistic and technically accurate?
- [ ] Does it explain when and when not to use the technique?
- [ ] Does it teach how to recognize or diagnose failure?
- [ ] If the lesson includes AI guidance, is AI already relevant to the scenario, and does the guidance add something beyond ordinary review?
- [ ] Does the checkpoint test the intended capability?
- [ ] Can standalone Practice work independently?
- [ ] Are Core and Additional Practice classified correctly?
- [ ] Does every visual materially improve understanding?
- [ ] Are English and Indonesian capabilities equivalent?
- [ ] Does the Indonesian version sound naturally conversational?
- [ ] Does the Indonesian version preserve established technical terminology without awkward literal translation or unnecessary English-heavy prose?
- [ ] Does the readiness check prepare the learner for what follows?
