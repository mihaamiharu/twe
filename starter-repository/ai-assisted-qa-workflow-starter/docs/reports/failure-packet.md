# Seeded failure packet

This packet is intentionally synthetic and deterministic. It is for practicing evidence-first triage, not for proving a product defect.

## Initial run

```text
Test: triage: repair this deliberately broken locator
Observed: locator timed out while looking for a heading that is not part of the approved exercise contract.
Classification candidate: test issue
```

## Investigation task

1. Preserve this initial packet.
2. Remove `test.fixme` from `tests/triage/seeded-failure.spec.ts`.
3. Run the test and capture the real failure evidence.
4. Inspect the page and the fictional acceptance criteria.
5. Replace the incorrect locator only when your evidence supports the change.
6. Record whether the failure was a test issue, product issue, environment issue, or test-data issue.

Do not weaken the assertion or increase timeouts just to make the test pass.
