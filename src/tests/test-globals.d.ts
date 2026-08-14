import type { Mock } from 'bun:test';
import type { TrackId } from '@/config/tracks';

declare global {
  var mockSearchParams: {
    track?: TrackId;
    q?: string;
    hideCompleted?: boolean;
    view?: 'grid' | 'list';
    tier?: string;
  };

  var mockNavigate: Mock<() => Promise<void>>;
}

export {};
