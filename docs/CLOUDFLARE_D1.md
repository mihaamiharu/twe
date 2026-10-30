# D1 schema and atomic application writes

The release branch ports the pinned production baseline (14 tables, PostgreSQL migrations 0000–0005) to D1. Courses were absent from that baseline and remain out of scope; this migration does not add or delete course data. The PostgreSQL schema/client and operational tools remain under `src/db/legacy/`; historical migrations remain unchanged under `drizzle/migrations/`.

## Representations

| PostgreSQL                  | D1 / Drizzle                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| UUID                        | Text, preserving every existing ID; new IDs use Web Crypto UUIDs               |
| Enum                        | Text union plus SQL CHECK constraints for existing enum fields                 |
| Boolean                     | Integer 0/1, SQL CHECK, Drizzle boolean mode                                   |
| Integer                     | Integer with PostgreSQL signed 32-bit range CHECKs                             |
| Timestamp without time zone | UTC wall-clock interpretation, integer Unix milliseconds, Drizzle timestamp_ms |
| JSONB                       | Canonical JSON text with json_valid constraints, Drizzle JSON mode             |
| text[] tags                 | JSON arrays of strings; order preserved                                        |
| Nullable foreign key        | Nullable text with the original delete behavior                                |

Production's timestamp interpretation follows the old application's JavaScript Date/PostgreSQL serialization as UTC. Export explicitly appends UTC to timezone-less timestamp text. Milliseconds match the application's Date precision; PostgreSQL sub-millisecond fractions are truncated. Do not reinterpret stored wall clocks as the workstation's timezone.

The schema retains cascades, set-null relationships, unique email/token/slug values, progress's exactly-one-target CHECK, partial user/tutorial and user/challenge uniqueness, and user/achievement uniqueness. Additional FK, leaderboard and time-based indexes are checked in. New `reward_operations` and `rate_limit_buckets` tables support the Worker write/abuse-control designs.

`drizzle/d1/0000_*.sql` creates the complete schema; `0001_*.sql` adds query indexes as a separate additive upgrade. Neither file has been applied to production. Use `bun run db:generate` for later changes and review generated SQLite rebuilds carefully: D1's foreign-key enforcement cannot be bypassed by assuming PostgreSQL or ordinary SQLite migration behavior.

## Binding and auth lifecycle

`#platform` resolves to Cloudflare bindings in workerd, and to Wrangler's local platform proxy for CLI scripts. Database/auth construction is lazy; no application request opens a PostgreSQL socket or loads dotenv. The local proxy explicitly disables remote bindings.

Better Auth uses the SQLite Drizzle adapter with the existing users/sessions/accounts/verification mapping. Existing password hashes, IDs, account/provider linkage, tokens, roles, and expiry values are copied without rewriting. The installed Better Auth version and password implementation are retained. A role cannot be supplied by a registration request.

Retain the exact production BETTER_AUTH_SECRET, production origin, cookie name/prefix, secure-cookie behavior, path and domain at cutover. These defaults were not intentionally changed. Retaining database tokens alone does not prove cookie/session compatibility: existing-cookie, password, Google linkage, token expiry and refresh checks remain release gates. Preview uses separate secrets and callbacks, never production cookies or the production dataset by default.

Verification/reset sends are awaited and fail explicitly. Verification resend now calls Better Auth's signed-token API; it no longer constructs an unsigned UUID verification link.

## Atomic reward batch

`runProgressRewardTransaction` retains its exported name for callers but implements a prepared D1 batch, not an interactive transaction. D1 executes the statements serially and rolls back the batch if a statement fails.

1. Initialize the unique progress row without replacing an existing one.
2. Snapshot the current progress, hint flag, user XP and first-completion decision into this request's operation row, entirely in SQL.
3. Insert the submission, update attempts/completion/best submission, increment the entity counter conditionally, and atomically add completion XP.
4. Derive level from the authoritative XP and snapshot eligible achievements using the same static criteria as before.
5. Insert unique achievement awards tagged with this operation ID, add only those newly inserted awards' database-defined XP, and derive the final level.
6. Read the operation result and newly awarded achievements before the batch commits.

Every operation gets a fresh UUID. Retried attempts may create another submission and increment attempts, as before; progress uniqueness prevents repeat completion credit. Concurrent different targets use SQL increments and cannot overwrite another completion's XP. Achievement uniqueness and operation ownership prevent duplicate award credit. The eligibility snapshot prevents achievement XP from cascading into extra eligibility in the middle of the same completion.

Standalone bug-report achievement awards also insert/unlock/add XP/derive level in one batch. Their notification is awaited, while optional notification failure does not undo the stored report. SQL CHECK/FK failures abort a reward batch, including its progress/submission/counter writes. This design still needs actual D1 concurrency, retry and injected-failure evidence.

The scheduled Worker removes expired limiter entries and operation diagnostics older than 30 days. Learner progress, submissions and achievement unlocks are retained; their unique constraints remain the reward invariants after diagnostic cleanup.

## Validation still required

Run empty creation and incremental migration, all integration fixtures and concurrent same/different-target completions, failed attempts/retries, hint races, level boundaries, achievement eligibility, and failure rollback. Check admin/leaderboard/profile sorting and JSON/date projections. Measure D1 calls/rows and Worker CPU before selecting Free. No runtime compatibility claim follows from source generation alone.

References: [D1 batch semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
