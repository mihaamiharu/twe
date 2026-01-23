-- Convert text columns to jsonb for i18n support (idempotent)
-- Only runs conversion if column is currently text type

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'name') = 'text' THEN
        ALTER TABLE "achievements" ALTER COLUMN "name" SET DATA TYPE jsonb USING jsonb_build_object('en', "name");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'description') = 'text' THEN
        ALTER TABLE "achievements" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'title') = 'text' THEN
        ALTER TABLE "challenges" ALTER COLUMN "title" SET DATA TYPE jsonb USING jsonb_build_object('en', "title");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'description') = 'text' THEN
        ALTER TABLE "challenges" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'instructions') = 'text' THEN
        ALTER TABLE "challenges" ALTER COLUMN "instructions" SET DATA TYPE jsonb USING jsonb_build_object('en', "instructions");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'tutorials' AND column_name = 'title') = 'text' THEN
        ALTER TABLE "tutorials" ALTER COLUMN "title" SET DATA TYPE jsonb USING jsonb_build_object('en', "title");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'tutorials' AND column_name = 'description') = 'text' THEN
        ALTER TABLE "tutorials" ALTER COLUMN "description" SET DATA TYPE jsonb USING jsonb_build_object('en', "description");
    END IF;
END $$;

DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'tutorials' AND column_name = 'content') = 'text' THEN
        ALTER TABLE "tutorials" ALTER COLUMN "content" SET DATA TYPE jsonb USING jsonb_build_object('en', "content");
    END IF;
END $$;