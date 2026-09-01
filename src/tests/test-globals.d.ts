import type { Mock } from 'bun:test';
import type { TrackId } from '@/config/tracks';
import type { TutorialListResponse } from '@/lib/tutorials.query';

interface QueryMockOptions {
  queryKey?: readonly unknown[];
}

declare global {
  interface MockNavigateOptions {
    search?: unknown;
  }

  var mockSearchParams: {
    track?: TrackId;
    q?: string;
    tier?: 'basic' | 'beginner' | 'intermediate' | 'e2e';
    hideCompleted?: boolean;
    view?: 'grid' | 'list';
  };
  var mockLoaderData: TutorialListResponse;

  var mockNavigate: Mock<(options?: MockNavigateOptions) => Promise<void>>;
  var mockUseQuery: Mock<(options: QueryMockOptions) => unknown>;
}

export {};
