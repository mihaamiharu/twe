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
    hideCompleted?: boolean;
    view?: 'grid' | 'list';
    tier?: string;
  };
  var mockLoaderData: TutorialListResponse;

  var mockNavigate: Mock<() => Promise<void>>;
  var mockUseQuery: Mock<(options: QueryMockOptions) => unknown>;
}

export {};
