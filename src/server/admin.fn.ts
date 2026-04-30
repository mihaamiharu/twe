// Deprecated: This file is kept for backward compatibility.
// Import directly from `@/server/admin/<module>.fn` instead.
export { getAdminStats } from './admin/stats.fn';
export { getAdminUsers, deleteUser, updateUserStatus, getAdminUserDetail } from './admin/users.fn';
export { getAdminChallenges, updateChallengeStatus } from './admin/challenges.fn';
export { getAdminBugs, updateBugStatus } from './admin/bugs.fn';
export { getAdminSubmissions } from './admin/submissions.fn';
export { getAdminTutorials, updateTutorialStatus } from './admin/tutorials.fn';
export { getAdminAchievements } from './admin/achievements.fn';
export { getAdminSubscribers, updateSubscriberStatus } from './admin/newsletter.fn';
export { getAdminMessages, updateMessageStatus } from './admin/messages.fn';
export { syncContentFn } from './admin/content.fn';
