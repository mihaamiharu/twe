import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as router from '@tanstack/react-router';
import * as query from '@tanstack/react-query';

// Mutable mock state
let mockSearchParams = { track: 'all', q: '', view: 'grid', hideCompleted: false, tier: undefined };
const mockNavigate = mock(() => Promise.resolve());

// Mock dependencies
mock.module('@tanstack/react-router', () => ({
    createFileRoute: () => () => ({
        useParams: () => ({ locale: 'en' }),
        useSearch: () => mockSearchParams,
        useNavigate: () => mockNavigate,
    }),
    Link: ({ children, to, params, className }: any) => (
        <a href={to} data-params={JSON.stringify(params)} className={className}>
            {children}
        </a>
    ),
    isRedirect: () => false,
    redirect: () => { },
    Outlet: () => null,
    useRouter: () => ({}),
    useMatch: () => ({}),
}));

mock.module('@tanstack/react-query', () => ({
    useSuspenseQuery: mock(),
}));

mock.module('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const parts = key.split('.');
            return parts[parts.length - 1];
        },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: () => { },
    },
}));

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
            category: 'playwright-basics', // defaults to intermediate or matches core logic
            xpReward: 50,
            order: 3,
            completionCount: 10,
            isCompleted: false,
            tags: [],
        },
    ];

    beforeEach(() => {
        mock.restore();
        mockSearchParams = { track: 'all', q: '', view: 'grid', hideCompleted: false, tier: undefined };

        // Setup query mock with SEARCH filtering simulation
        (query.useSuspenseQuery as any).mockImplementation((options: any) => {
            const filters = options.queryKey?.[1];
            const searchQuery = filters?.search?.toLowerCase();

            let filtered = mockChallenges;
            if (searchQuery) {
                filtered = mockChallenges.filter(c =>
                    c.title.toLowerCase().includes(searchQuery) ||
                    c.description.toLowerCase().includes(searchQuery)
                );
            }

            return { data: { data: filtered } };
        });
    });

    afterEach(() => {
        cleanup();
    });

    const renderPage = async () => {
        // Dynamic import to ensure mocks apply
        const { ChallengesPage } = await import('@/routes/$locale/challenges/index');
        return render(<ChallengesPage />);
    };

    it('should render all challenges by default', async () => {
        await renderPage();

        expect(screen.getByText('JS Basic Challenge')).toBeTruthy();
        expect(screen.getByText('CSS Selector Master')).toBeTruthy();
        expect(screen.getByText('Playwright E2E')).toBeTruthy();
    });

    it('should filter by track (selectors)', async () => {
        mockSearchParams = { ...mockSearchParams, track: 'selectors' };

        await renderPage();

        // JS Basic (tier beginner) should be excluded
        expect(screen.queryByText('JS Basic Challenge')).toBeNull();
        // CSS Selector (type CSS_SELECTOR) should be included
        expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    });

    it('should filter by search query', async () => {
        // Set query in params. Component syncs this to useDebounce state, passing it to query options.
        // Our smart mock catches the query option updates.
        mockSearchParams = { ...mockSearchParams, q: 'Playwright' };

        await renderPage();

        expect(screen.queryByText('JS Basic Challenge')).toBeNull();
        expect(screen.queryByText('CSS Selector Master')).toBeNull();
        expect(screen.getByText('Playwright E2E')).toBeTruthy();
    });

    it('should hide completed challenges', async () => {
        mockSearchParams = { ...mockSearchParams, hideCompleted: true };

        await renderPage();

        // JS Basic is completed, should be hidden
        expect(screen.queryByText('JS Basic Challenge')).toBeNull();
        expect(screen.getByText('CSS Selector Master')).toBeTruthy();
    });

    it('should switch to list view', async () => {
        mockSearchParams = { ...mockSearchParams, view: 'list' };

        await renderPage();

        // List view still renders content
        expect(screen.getByText('JS Basic Challenge')).toBeTruthy();
    });

    it('should update search params when typing in search box', async () => {
        await renderPage();

        const searchInput = screen.getByPlaceholderText('Search challenges...');
        fireEvent.change(searchInput, { target: { value: 'New Search' } });

        expect((searchInput as HTMLInputElement).value).toBe('New Search');
    });
    it('should show empty state when no matches found', async () => {
        mockSearchParams = { ...mockSearchParams, q: 'NonExistent' };
        await renderPage();

        expect(screen.getByText(/no challenges found/i)).toBeTruthy();
        // Should show clear filter button or link
        expect(screen.getByRole('button', { name: /clear/i })).toBeTruthy();
    });
});
