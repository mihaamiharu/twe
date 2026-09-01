# Curriculum v2 production reset

This is a one-time operational reset for the Curriculum v2 launch. It removes
learner progress and achievement awards, resets XP and levels, and resets
challenge completion counters. User accounts, content, sessions, and historical
submissions are preserved.

Run only after taking and validating a production backup, applying migrations,
and completing the content sync:

```sh
CURRICULUM_RESET_CONFIRM=RESET_CURRICULUM_V2 \
  bun run db:reset-curriculum --confirm
```

The command refuses to run unless both the confirmation token and `--confirm`
are present. It runs all changes in one database transaction.
