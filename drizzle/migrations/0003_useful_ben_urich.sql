-- Progress rows must identify exactly one catalog entity. Reject orphan rows
-- because there is no safe way to infer which tutorial or challenge they
-- represent. Mixed rows are split before the exact-key dedupe below.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "progress"
		WHERE "tutorial_id" IS NULL AND "challenge_id" IS NULL
	) THEN
		RAISE EXCEPTION 'progress contains rows without a tutorial_id or challenge_id'
			USING HINT = 'Repair orphan progress rows before applying migration 0003';
	END IF;
END $$;
--> statement-breakpoint

-- Preserve both sides of a legacy mixed row. The original row becomes the
-- tutorial record; the new row carries challenge attempts, submission, and
-- hint fields. The exact-key merge below resolves any resulting duplicates.
INSERT INTO "progress" (
	"user_id",
	"tutorial_id",
	"challenge_id",
	"is_completed",
	"completed_at",
	"last_accessed_at",
	"reading_progress",
	"attempts",
	"best_submission_id",
	"used_hint",
	"hint_content",
	"created_at",
	"updated_at"
)
SELECT
	p."user_id",
	NULL,
	p."challenge_id",
	p."is_completed",
	p."completed_at",
	p."last_accessed_at",
	0,
	p."attempts",
	p."best_submission_id",
	p."used_hint",
	p."hint_content",
	p."created_at",
	p."updated_at"
FROM "progress" p
WHERE p."tutorial_id" IS NOT NULL AND p."challenge_id" IS NOT NULL;
--> statement-breakpoint

UPDATE "progress"
SET
	"challenge_id" = NULL,
	"attempts" = 0,
	"best_submission_id" = NULL,
	"used_hint" = false,
	"hint_content" = NULL,
	"reading_progress" = COALESCE("reading_progress", 0)
WHERE "tutorial_id" IS NOT NULL AND "challenge_id" IS NOT NULL;
--> statement-breakpoint

-- Map every row to a deterministic survivor using the same keys enforced by
-- the two unique indexes. Completed progress wins, then the newest activity,
-- then created time and id provide stable tie-breakers.
CREATE TEMP TABLE "progress_dedupe_map_0003" ON COMMIT DROP AS
WITH ranked AS (
	SELECT
		p."id",
		first_value(p."id") OVER (
			PARTITION BY p."user_id", p."tutorial_id"
			ORDER BY p."is_completed" DESC, p."completed_at" DESC NULLS LAST,
				p."updated_at" DESC, p."created_at" DESC, p."id"
		) AS survivor_id
	FROM "progress" p
	WHERE p."tutorial_id" IS NOT NULL

	UNION ALL

	SELECT
		p."id",
		first_value(p."id") OVER (
			PARTITION BY p."user_id", p."challenge_id"
			ORDER BY p."is_completed" DESC, p."completed_at" DESC NULLS LAST,
				p."updated_at" DESC, p."created_at" DESC, p."id"
		) AS survivor_id
	FROM "progress" p
	WHERE p."challenge_id" IS NOT NULL
)
SELECT "id", survivor_id
FROM ranked;
--> statement-breakpoint

CREATE TEMP TABLE "progress_dedupe_merged_0003" ON COMMIT DROP AS
SELECT
	m.survivor_id,
	bool_or(p."is_completed") AS is_completed,
	max(p."completed_at") AS completed_at,
	max(p."last_accessed_at") AS last_accessed_at,
	max(COALESCE(p."reading_progress", 0))::integer AS reading_progress,
	COALESCE(sum(COALESCE(p."attempts", 0)), 0)::integer AS attempts,
	(
		array_agg(
			p."best_submission_id"
			ORDER BY p."is_completed" DESC, p."completed_at" DESC NULLS LAST,
				p."updated_at" DESC, p."created_at" DESC, p."id"
		)
		FILTER (WHERE p."best_submission_id" IS NOT NULL)
	)[1] AS best_submission_id,
	bool_or(p."used_hint") AS used_hint,
	(
		array_agg(
			p."hint_content"
			ORDER BY p."updated_at" DESC, p."created_at" DESC, p."id"
		)
		FILTER (WHERE p."hint_content" IS NOT NULL)
	)[1] AS hint_content,
	max(p."updated_at") AS updated_at
FROM "progress_dedupe_map_0003" m
INNER JOIN "progress" p ON p."id" = m."id"
GROUP BY m.survivor_id;
--> statement-breakpoint

UPDATE "progress" p
SET
	"is_completed" = m.is_completed,
	"completed_at" = m.completed_at,
	"last_accessed_at" = m.last_accessed_at,
	"reading_progress" = m.reading_progress,
	"attempts" = m.attempts,
	"best_submission_id" = m.best_submission_id,
	"used_hint" = m.used_hint,
	"hint_content" = m.hint_content,
	"updated_at" = m.updated_at
FROM "progress_dedupe_merged_0003" m
WHERE p."id" = m.survivor_id;
--> statement-breakpoint

DELETE FROM "progress" p
USING "progress_dedupe_map_0003" m
WHERE p."id" = m."id" AND m."id" <> m.survivor_id;
--> statement-breakpoint

CREATE UNIQUE INDEX "progress_user_tutorial_unique"
	ON "progress" USING btree ("user_id", "tutorial_id")
	WHERE "progress"."tutorial_id" IS NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX "progress_user_challenge_unique"
	ON "progress" USING btree ("user_id", "challenge_id")
	WHERE "progress"."challenge_id" IS NOT NULL;
