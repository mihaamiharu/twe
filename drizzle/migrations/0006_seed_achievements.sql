-- Custom SQL migration file, put your code below! --

-- Achievements data migration
-- Using ON CONFLICT DO UPDATE to ensure idempotency and update values if changed

INSERT INTO achievements (slug, name, description, icon, category, requirement_type, requirement_value, xp_reward, is_secret)
VALUES 
    -- Challenges
    ('first-challenge', 
     '{"en": "First Steps"}', 
     '{"en": "Complete your first challenge", "id": "Selesaikan tantangan pertamamu"}', 
     '🎯', 'CHALLENGES', 'count', 1, 50, false),

    ('challenge-10', 
     '{"en": "Getting Warmed Up"}', 
     '{"en": "Complete 10 challenges", "id": "Selesaikan 10 tantangan"}', 
     '🔥', 'CHALLENGES', 'count', 10, 100, false),

    ('challenge-25', 
     '{"en": "Challenge Accepted"}', 
     '{"en": "Complete 25 challenges", "id": "Selesaikan 25 tantangan"}', 
     '⚡', 'CHALLENGES', 'count', 25, 200, false),

    ('challenge-50', 
     '{"en": "Halfway Hero"}', 
     '{"en": "Complete 50 challenges", "id": "Selesaikan 50 tantangan"}', 
     '🏆', 'CHALLENGES', 'count', 50, 500, false),

    ('challenge-100', 
     '{"en": "Centurion", "id": "Centurion"}', 
     '{"en": "Complete 100 challenges", "id": "Selesaikan 100 tantangan"}', 
     '👑', 'CHALLENGES', 'count', 100, 1000, false),

    -- Streak
    ('streak-3', 
     '{"en": "On Fire"}', 
     '{"en": "Maintain a 3-day streak", "id": "Pertahankan streak selama 3 hari"}', 
     '🔥', 'STREAK', 'streak', 3, 50, false),

    ('streak-7', 
     '{"en": "Week Warrior"}', 
     '{"en": "Maintain a 7-day streak", "id": "Pertahankan streak selama 7 hari"}', 
     '⚡', 'STREAK', 'streak', 7, 100, false),

    ('streak-14', 
     '{"en": "Two Week Champion"}', 
     '{"en": "Maintain a 14-day streak", "id": "Pertahankan streak selama 14 hari"}', 
     '💪', 'STREAK', 'streak', 14, 200, false),

    ('streak-30', 
     '{"en": "Monthly Master"}', 
     '{"en": "Maintain a 30-day streak", "id": "Pertahankan streak selama 30 hari"}', 
     '🏆', 'STREAK', 'streak', 30, 500, false),

    -- XP
    ('xp-100', 
     '{"en": "XP Starter"}', 
     '{"en": "Earn 100 XP", "id": "Dapatkan 100 XP"}', 
     '✨', 'XP', 'xp', 100, 25, false),

    ('xp-500', 
     '{"en": "XP Hunter"}', 
     '{"en": "Earn 500 XP", "id": "Dapatkan 500 XP"}', 
     '💫', 'XP', 'xp', 500, 50, false),

    ('xp-1000', 
     '{"en": "XP Collector"}', 
     '{"en": "Earn 1,000 XP", "id": "Dapatkan 1.000 XP"}', 
     '🌟', 'XP', 'xp', 1000, 100, false),

    ('xp-2500', 
     '{"en": "XP Master"}', 
     '{"en": "Earn 2,500 XP", "id": "Dapatkan 2.500 XP"}', 
     '⭐', 'XP', 'xp', 2500, 200, false),

    ('xp-5000', 
     '{"en": "XP Legend"}', 
     '{"en": "Earn 5,000 XP", "id": "Dapatkan 5.000 XP"}', 
     '🌠', 'XP', 'xp', 5000, 500, false),

    -- Daily Grind
    ('daily-5', 
     '{"en": "Warming Up", "id": "Pemanasan"}', 
     '{"en": "Complete 5 challenges in one day", "id": "Selesaikan 5 tantangan dalam satu hari"}', 
     '☀️', 'CHALLENGES', 'daily', 5, 100, false),

    ('daily-10', 
     '{"en": "On a Roll", "id": "Sedang Lancar"}', 
     '{"en": "Complete 10 challenges in one day", "id": "Selesaikan 10 tantangan dalam satu hari"}', 
     '🔥', 'CHALLENGES', 'daily', 10, 200, false),

    ('daily-15', 
     '{"en": "Unstoppable", "id": "Tidak Terhentikan"}', 
     '{"en": "Complete 15 challenges in one day", "id": "Selesaikan 15 tantangan dalam satu hari"}', 
     '⚡', 'CHALLENGES', 'daily', 15, 400, false),

    ('daily-20', 
     '{"en": "Marathon Runner", "id": "Pelari Maraton"}', 
     '{"en": "Complete 20 challenges in one day", "id": "Selesaikan 20 tantangan dalam satu hari"}', 
     '🏃', 'CHALLENGES', 'daily', 20, 600, false),

    -- Config / Special
    ('first-tutorial', 
     '{"en": "Eager Learner"}', 
     '{"en": "Complete your first tutorial", "id": "Selesaikan tutorial pertamamu"}', 
     '📖', 'TUTORIALS', 'count', 1, 25, false),

    ('bug-squasher', 
     '{"en": "Bug Squasher"}', 
     '{"en": "Report your first valid bug", "id": "Laporkan bug valid pertamamu"}', 
     '🐞', 'SPECIAL', 'count', 1, 100, false)

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    xp_reward = EXCLUDED.xp_reward,
    is_secret = EXCLUDED.is_secret;