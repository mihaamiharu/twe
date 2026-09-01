/**
 * Backwards-compatible names for filesystem content consumers.
 *
 * New Learn and Practice code should import the explicit catalog contracts
 * from `content-catalog.server.ts`. This module intentionally contains no DB
 * access or mutations; existing sync/AI/dashboard callers can keep their
 * established function names while migrating independently.
 */

import {
  clearCatalogTierTotalsCache,
  clearContentCatalogCaches,
  getCachedCatalogTierTotals,
  getChallengeCatalogDetail,
  getChallengeCatalogList,
  getNextTutorialCatalogItem,
  getRawChallengeCatalogContent,
  getTutorialCatalogDetail,
  getTutorialCatalogList,
  validateCatalogRelationships,
} from './content-catalog.server';

export {
  getChallengeCatalogDetail,
  getChallengeCatalogList,
  getTutorialCatalogDetail,
  getTutorialCatalogList,
  validateCatalogRelationships,
};

export const getTutorialContent = getTutorialCatalogDetail;
export const getTutorialList = getTutorialCatalogList;
export const getChallengeContent = getChallengeCatalogDetail;
export const getChallengeList = getChallengeCatalogList;
export const getRawChallengeContent = getRawChallengeCatalogContent;
export const getNextTutorial = getNextTutorialCatalogItem;

export function clearContentCaches(): void {
  clearContentCatalogCaches();
  clearCatalogTierTotalsCache();
}

export const getCachedTierTotals = getCachedCatalogTierTotals;
