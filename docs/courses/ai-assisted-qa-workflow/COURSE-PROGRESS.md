# AI-Assisted QA Workflow — Progress and Completion Contract

**Task:** QA-003

The course uses the existing `tutorials`, `progress`, `users.xp`, and achievement tables. It does not add a generalized course-progress table or a new currency.

## Unit completion

Each checkpoint and the capstone is represented by a hidden, course-tagged tutorial record. The learner's progress row is keyed by the existing `userId` and tutorial ID. These records are implementation details for progression and are excluded from generic tutorial statistics.

The completion actions are:

1. The learner submits the checkpoint or capstone's stable completion ID and reflection ID.
2. The learner confirms that the exercise and reflection are complete.
3. The server validates the Indonesian-only course content and identifiers, then records `isCompleted: true`.

There is no artifact upload, automatic grading, AI approval, or human approval in this contract. Review state is not read by completion handlers and cannot change completion, XP, or achievement state.

## XP and idempotency

- A checkpoint's first self-attested completion awards the existing tutorial reward of 25 XP.
- Repeating a checkpoint completion awards 0 XP and leaves the completion state unchanged.
- The capstone is required for course completion but awards 0 additional XP because it is not a checkpoint.
- Completion requests for one learner and course are serialized so duplicate first-completion requests cannot award XP twice.

## Course achievement

The static achievement `ai-assisted-qa-workflow-complete` is awarded once, after all seven checkpoint progress rows and the capstone progress row are complete. It is a zero-XP completion marker; checkpoint XP remains the only course XP rule. The existing unique `(userId, achievementId)` constraint makes the award idempotent.

Only the `id` locale is accepted. English and other locales cannot create or retrieve course progress through this contract.
