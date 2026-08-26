import type { Mock } from 'bun:test';
import type { TrackId } from '@/config/tracks';
import type { TutorialListResponse } from '@/lib/tutorials.query';

interface QueryMockOptions {
  queryKey?: readonly unknown[];
}

declare global {
  var mockSearchParams: {
    track?: TrackId;
    q?: string;
    tier?: 'basic' | 'beginner' | 'intermediate' | 'e2e';
    hideCompleted?: boolean;
    view?: 'grid' | 'list';
  };
  var mockLoaderData: TutorialListResponse;

  var mockNavigate: Mock<() => Promise<void>>;
  var mockUseQuery: Mock<(options: QueryMockOptions) => unknown>;
}

export {};
