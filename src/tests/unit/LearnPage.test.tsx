import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import '@tanstack/react-query';
import type { TutorialListResponse } from '@/lib/tutorials.query';

const module = {
  slug: 'automation-judgment',
  order: 1,
  title: 'Automation Judgment',
  description: 'Choose worthwhile automation.',
  outcome: 'Choose and explain the right automation target.',
};

const lessons: TutorialListResponse = {
  success: true,
  data: [
    {
      id: 'first-id',
      slug: 'first-lesson',
      title: 'First lesson',
      description: 'Start here.',
      order: 1,
      module,
      moduleOrder: 1,
      kind: 'core',
      estimatedMinutes: 5,
      tags: ['foundations'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: false,
    },
    {
      id: 'completed-id',
      slug: 'completed-lesson',
      title: 'Completed lesson',
      description: 'Already covered.',
      order: 2,
      module,
      moduleOrder: 2,
      kind: 'core',
      estimatedMinutes: 5,
      tags: ['beginner'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: true,
    },
  ],
  meta: {
    availableTags: ['beginner', 'foundations'],
    modules: [
      {
        ...module,
        coreLessons: 2,
        completedCoreLessons: 1,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
    ],
    completion: {
      coreLessons: 2,
      completedCoreLessons: 1,
      corePractice: 0,
      completedCorePractice: 0,
      isCompleted: false,
    },
  },
  pagination: { page: 1, limit: 2, total: 2, totalPages: 1 },
};

describe('LearnPage', () => {
  beforeEach(() => {
    globalThis.mockLoaderData = lessons;
    globalThis.mockSearchParams = {};
    globalThis.mockUseQuery.mockImplementation((options) => {
      if (options.queryKey?.[0] === 'auth') {
        return { data: { user: null } };
      }
      return { data: lessons };
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = async () => {
    const { default: LearnPage } = await import('@/routes/$locale/learn');
    return render(<LearnPage />);
  };

  it('keeps the ordered list and ignores guest completion URL state', async () => {
    globalThis.mockSearchParams = { hideCompleted: true };

    await renderPage();

    expect(screen.queryByTestId('learn-completion-filter')).toBeNull();
    const rows = screen.getAllByTestId('lesson-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent ?? '').toContain('First lesson');
    expect(rows[1]?.textContent ?? '').toContain('Completed lesson');
  });

  it('shows authenticated remaining-only filtering and its clear action', async () => {
    globalThis.mockSearchParams = { hideCompleted: true, q: 'First' };
    globalThis.mockUseQuery.mockImplementation((options) => {
      if (options.queryKey?.[0] === 'auth') {
        return { data: { user: { id: 'user-1' } } };
      }
      return { data: lessons };
    });

    await renderPage();

    expect(screen.getByTestId('learn-completion-filter')).toBeTruthy();
    expect(screen.getByTestId('learn-completion-filter').textContent).toContain(
      'filters.showAll',
    );
    expect(screen.getByTestId('lesson-row').textContent).toContain(
      'First lesson',
    );
    expect(screen.getAllByTestId('lesson-row')).toHaveLength(1);
    expect(screen.getByTestId('learn-clear-filters')).toBeTruthy();
  });

  it('renders the viewer-scoped query result over the SSR loader snapshot', async () => {
    const reactiveLessons: TutorialListResponse = {
      ...lessons,
      data: [
        {
          ...lessons.data[0]!,
          slug: 'updated-lesson',
          title: 'Updated lesson state',
        },
      ],
      pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
    };
    globalThis.mockUseQuery.mockImplementation((options) => {
      if (options.queryKey?.[0] === 'auth') {
        return { data: { user: { id: 'user-1' } } };
      }
      return { data: reactiveLessons };
    });

    await renderPage();

    expect(screen.getByTestId('lesson-row').textContent).toContain(
      'Updated lesson state',
    );
    expect(screen.getByTestId('lesson-row').textContent).not.toContain(
      'First lesson',
    );
  });
});
