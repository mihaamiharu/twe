import {
  describe,
  it,
  expect,
  mock,
  beforeAll,
  beforeEach,
  afterEach,
} from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Mutable mock state
globalThis.mockSearchParams = {
  track: 'all',
  q: '',
  view: 'grid',
  hideCompleted: false,
};
globalThis.mockNavigate = mock((_options?: MockNavigateOptions) => {
  void _options;
  return Promise.resolve();
});

describe('ChallengesPage', () => {
  // Mock Data
  const mockChallenges = [
    {
      id: '1',
      slug: 'js-basic',
      title: 'JS Basic Challenge',
      description: 'Learn JS variables',
      type: 'JAVASCRIPT',
      difficulty: 'EASY',
      category: 'js-basics', // CHANGED to match 'js-' prefix for beginner tier
      xpReward: 10,
      order: 1,
      completionCount: 100,
      isCompleted: true,
      tags: [],
    },
    {
      id: '2',
      slug: 'css-selector',
      title: 'CSS Selector Master',
      description: 'Master CSS selectors',
      type: 'CSS_SELECTOR',
      difficulty: 'MEDIUM',
      category: 'css-basics',
      xpReward: 20,
      order: 2,
      completionCount: 50,
      isCompleted: false,
      tags: [],
    },
    {
      id: '3',
      slug: 'pw-test',
      title: 'Playwright E2E',
      description: 'E2E testing',
      type: 'PLAYWRIGHT',
      difficulty: 'HARD',
      category: 'playwright-navigation',
      xpReward: 50,
      order: 3,
      completionCount: 10,
      isCompleted: false,
      tags: [],
    },
  ];

  beforeAll(async () => {
    // Import once before beforeEach so the preload's query mock factory is
    // initialized even when this file runs in isolation.
    await import('@/routes/$locale/practice/index');
  });

  beforeEach(() => {
    globalThis.mockSearchParams = {
      track: 'all',
      q: '',
      view: 'grid',
      hideCompleted: false,
    };

    // Catalog reads return the complete authoritative list. Search is a
    // client-side projection over the displayed title/description.
    globalThis.mockUseQuery.mockImplementation((options) => {
      if (options.queryKey?.[0] === 'auth') {
        return { data: { user: null } };
      }
      return { data: { success: true, data: mockChallenges } };
    });

    globalThis.mockNavigate = mock((options?: MockNavigateOptions) => {
      const search = options?.search;
      const nextSearch =
        typeof search === 'function'
          ? (search as (
              previous: typeof globalThis.mockSearchParams,
            ) => typeof globalThis.mockSearchParams)(
              globalThis.mockSearchParams,
            )
          : (search as typeof globalThis.mockSearchParams | undefined);
      if (nextSearch) globalThis.mockSearchParams = nextSearch;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = async () => {
    // Dynamic import to ensure mocks apply
    const { ChallengesPage } = await import('@/routes/$locale/practice/index');
    return {
      ...render(<ChallengesPage />),
      ChallengesPage,
    };
  };

  it('should render all challenges by default', async () => {
    await renderPage();

    expect(screen.getByText('JS Basic Challenge')).toBeTruthy();
    expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    expect(screen.getByText('Playwright E2E')).toBeTruthy();
  });

  it('should filter by track (selectors)', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      track: 'selectors',
    };

    await renderPage();

    // JS Basic (tier beginner) should be excluded
    expect(screen.queryByText('JS Basic Challenge')).toBeNull();
    // CSS Selector (type CSS_SELECTOR) should be included
    expect(screen.getByText('CSS Selector Master')).toBeTruthy();
  });

  it('should filter by search query', async () => {
    // Search is a URL-backed client-side projection.
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      q: 'Playwright',
    };

    await renderPage();

    expect(Reflect.get(screen.getByRole('textbox'), 'value')).toBe(
      'Playwright',
    );
    expect(screen.queryByText('JS Basic Challenge')).toBeNull();
    expect(screen.queryByText('CSS Selector Master')).toBeNull();
    expect(screen.getByText('Playwright E2E')).toBeTruthy();
  });

  it('should filter by the URL-backed tier', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      tier: 'basic',
    };

    await renderPage();

    expect(screen.queryByText('JS Basic Challenge')).toBeNull();
    expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    expect(screen.queryByText('Playwright E2E')).toBeNull();
  });

  it('should not show or apply completion filtering to guests', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      hideCompleted: true,
    };

    await renderPage();

    expect(screen.getByText('JS Basic Challenge')).toBeTruthy();
    expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('should hide completed challenges for authenticated users', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      hideCompleted: true,
    };
    globalThis.mockUseQuery.mockImplementation((options) => {
      if (options.queryKey?.[0] === 'auth') {
        return { data: { user: { id: 'user-1' } } };
      }
      return { data: { success: true, data: mockChallenges } };
    });

    await renderPage();

    expect(screen.queryByText('JS Basic Challenge')).toBeNull();
    expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('should switch to list view', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      view: 'list',
    };

    await renderPage();

    // List view still renders content
    expect(screen.getByText('JS Basic Challenge')).toBeTruthy();
  });

  it('should update search params when typing in search box', async () => {
    globalThis.mockNavigate.mockClear();
    await renderPage();

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'New Search' } });

    expect(globalThis.mockNavigate).toHaveBeenCalled();
  });

  it('should support roving keyboard focus and selection for track tabs', async () => {
    globalThis.mockNavigate.mockClear();
    const rendered = await renderPage();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]?.getAttribute('tabindex')).toBe('0');
    expect(tabs[1]?.getAttribute('tabindex')).toBe('-1');

    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    expect(globalThis.mockNavigate).toHaveBeenCalled();
    rendered.rerender(<rendered.ChallengesPage />);
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]!);

    const updatedTabs = screen.getAllByRole('tab');
    updatedTabs[1]!.focus();
    fireEvent.keyDown(updatedTabs[1]!, { key: 'End' });
    rendered.rerender(<rendered.ChallengesPage />);
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[4]!);

    const finalTabs = screen.getAllByRole('tab');
    finalTabs[4]!.focus();
    fireEvent.keyDown(finalTabs[4]!, { key: 'Home' });
    rendered.rerender(<rendered.ChallengesPage />);
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[0]!);
  });
  it('should show empty state when no matches found', async () => {
    globalThis.mockSearchParams = {
      ...globalThis.mockSearchParams,
      q: 'NonExistent',
    };
    await renderPage();

    expect(screen.getByText('library.emptyTitle')).toBeTruthy();
    // Should show clear filter button or link
    expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
  });
});
