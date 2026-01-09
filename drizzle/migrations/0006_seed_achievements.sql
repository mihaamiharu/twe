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

    ('challenge-88', 
     '{"en": "Completionist"}', 
     '{"en": "Complete all 88 challenges", "id": "Selesaikan semua 88 tantangan"}', 
     '👑', 'CHALLENGES', 'count', 88, 1000, false),

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

    -- Tiers
    ('tier-basic-master', 
     '{"en": "Selector Specialist"}', 
     '{"en": "Complete all Basic tier challenges", "id": "Selesaikan semua tantangan tier Basic"}', 
     '🎨', 'CHALLENGES', 'count:CSS_SELECTOR', 15, 150, false),

    ('tier-beginner-master', 
     '{"en": "JavaScript Hero"}', 
     '{"en": "Complete all Beginner tier challenges", "id": "Selesaikan semua tantangan tier Beginner"}', 
     '💛', 'CHALLENGES', 'count:JAVASCRIPT', 23, 200, false),

    ('tier-intermediate-master', 
     '{"en": "Playwright Pro"}', 
     '{"en": "Complete all Intermediate tier challenges", "id": "Selesaikan semua tantangan tier Intermediate"}', 
     '🎭', 'CHALLENGES', 'count:PLAYWRIGHT', 32, 300, false),

    ('tier-expert-master', 
     '{"en": "Automation Expert"}', 
     '{"en": "Complete all Expert tier challenges", "id": "Selesaikan semua tantangan tier Expert"}', 
     '🚀', 'CHALLENGES', 'count:PLAYWRIGHT', 18, 400, false),

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