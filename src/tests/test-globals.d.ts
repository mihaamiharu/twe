import type { Mock } from 'bun:test';
import type { TrackId } from '@/config/tracks';

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

  var mockNavigate: Mock<() => Promise<void>>;
  var mockUseQuery: Mock<(options: QueryMockOptions) => unknown>;
}

export {};
