-- Progress is logically one row per user and catalog item. Consolidate any
-- legacy duplicates before adding the uniqueness guarantees used by the
-- transactional completion paths below.
WITH ranked AS (
	SELECT
		p.*,
		first_value(p.id) OVER (
			PARTITION BY p.user_id, p.tutorial_id, p.challenge_id
			ORDER BY p.is_completed DESC, p.updated_at DESC, p.created_at DESC, p.id
		) AS survivor_id
	FROM "progress" p
	WHERE p.tutorial_id IS NOT NULL OR p.challenge_id IS NOT NULL
), merged AS (
	SELECT
		r.survivor_id,
		bool_or(p.is_completed) AS is_completed,
		max(p.completed_at) AS completed_at,
		max(p.last_accessed_at) AS last_accessed_at,
		max(coalesce(p.reading_progress, 0))::integer AS reading_progress,
		coalesce(sum(coalesce(p.attempts, 0)), 0)::integer AS attempts,
		(
			array_agg(
				p.best_submission_id
				ORDER BY p.is_completed DESC, p.updated_at DESC, p.created_at DESC
			) FILTER (WHERE p.best_submission_id IS NOT NULL)
		)[1] AS best_submission_id,
		bool_or(p.used_hint) AS used_hint,
		(
			array_agg(
				p.hint_content
				ORDER BY p.updated_at DESC, p.created_at DESC
			) FILTER (WHERE p.hint_content IS NOT NULL)
		)[1] AS hint_content,
		max(p.updated_at) AS updated_at
	FROM ranked r
	INNER JOIN "progress" p ON p.id = r.id
	GROUP BY r.survivor_id
)
UPDATE "progress" p
SET
	"is_completed" = merged.is_completed,
	"completed_at" = merged.completed_at,
	"last_accessed_at" = merged.last_accessed_at,
	"reading_progress" = merged.reading_progress,
	"attempts" = merged.attempts,
	"best_submission_id" = merged.best_submission_id,
	"used_hint" = merged.used_hint,
	"hint_content" = merged.hint_content,
	"updated_at" = merged.updated_at
FROM merged
WHERE p.id = merged.survivor_id;
--> statement-breakpoint
WITH ranked AS (
	SELECT
		p.id,
		first_value(p.id) OVER (
			PARTITION BY p.user_id, p.tutorial_id, p.challenge_id
			ORDER BY p.is_completed DESC, p.updated_at DESC, p.created_at DESC, p.id
		) AS survivor_id
	FROM "progress" p
	WHERE p.tutorial_id IS NOT NULL OR p.challenge_id IS NOT NULL
)
DELETE FROM "progress" p
USING ranked
WHERE p.id = ranked.id AND p.id <> ranked.survivor_id;
--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_tutorial_unique"
	ON "progress" USING btree ("user_id", "tutorial_id")
	WHERE "progress"."tutorial_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_challenge_unique"
	ON "progress" USING btree ("user_id", "challenge_id")
	WHERE "progress"."challenge_id" IS NOT NULL;
