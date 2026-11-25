import type { DehydratedState } from '@tanstack/react-query';

// Challenge workspaces and admin are tools, not pages to animate between.
export const isWorkspacePath = (pathname: string): boolean =>
  /\/practice\/[^/]+$/.test(pathname) || pathname.startsWith('/admin');

export function resolveViewTransitionTypes({
  fromPathname,
  toPathname,
  pathChanged,
  visibilityState,
  prefersReducedMotion,
}: {
  fromPathname?: string | undefined;
  toPathname: string;
  pathChanged: boolean;
  visibilityState?: DocumentVisibilityState | undefined;
  prefersReducedMotion?: boolean | undefined;
}): string[] | false {
  if (
    !fromPathname ||
    !pathChanged ||
    visibilityState !== 'visible' ||
    prefersReducedMotion ||
    isWorkspacePath(fromPathname) ||
    isWorkspacePath(toPathname)
  ) {
    return false;
  }
  return ['page'];
}

export interface DehydratedRouterQueryPayload {
  queryClientState: string;
}

export function serializeDehydratedQueryState(
  state: DehydratedState,
): DehydratedRouterQueryPayload {
  return {
    queryClientState: JSON.stringify(state),
  };
}

export function parseDehydratedQueryState(
  payload: DehydratedRouterQueryPayload | undefined,
): DehydratedState | undefined {
  if (!payload?.queryClientState) return undefined;
  try {
    const parsed: unknown = JSON.parse(payload.queryClientState);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as { queries?: unknown }).queries) ||
      !Array.isArray((parsed as { mutations?: unknown }).mutations)
    ) {
      return undefined;
    }
    return parsed as DehydratedState;
  } catch {
    return undefined;
  }
}
