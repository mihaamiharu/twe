import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import * as router from '@tanstack/react-router';

// Mock dependencies
mock.module('@tanstack/react-router', () => ({
    Link: ({ children, to, params, className }: any) => (
        <a href={to} data-params={JSON.stringify(params)} className={className}>
            {children}
        </a>
    ),
    createFileRoute: () => () => ({
        useParams: () => ({ locale: 'en' }),
        useSearch: () => ({ track: 'all' }),
        useNavigate: () => (() => Promise.resolve()),
    }),
    isRedirect: () => false,
    redirect: () => { },
    Outlet: () => null,
    useRouter: () => ({}),
    useMatch: () => ({}),
}));

mock.module('framer-motion', () => ({
    motion: {
        tr: ({ children, className, ...props }: any) => <tr className={className} {...props}>{children}</tr>,
        div: ({ children }: any) => <div>{children}</div>
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ChallengeRow', () => {
    let ChallengeRow: any;

    beforeEach(async () => {
        mock.restore();
        const module = await import('@/routes/$locale/challenges/index');
        ChallengeRow = module.ChallengeRow;
    });

    afterEach(() => {
        cleanup();
    });

    const mockChallenge = {
        id: '1',
        slug: 'test-challenge',
        title: 'Test Challenge',
        description: 'Description',
        type: 'JAVASCRIPT',
        difficulty: 'EASY',
        xpReward: 10,
        completionCount: 5,
        isCompleted: false,
    };

    const mockConfig = {
        color: 'bg-yellow-500',
        icon: <span>Icon</span>,
        label: 'JavaScript',
    };

    const mockT = (key: string) => key;

    it('should render challenge row', () => {
        // ChallengeRow renders a <tr>, so it must be in a <table>/<tbody>
        render(
            <table>
                <tbody>
                    <ChallengeRow
                        challenge={mockChallenge}
                        index={0}
                        config={mockConfig}
                        isComingSoon={false}
                        isBoss={false}
                        params={{ locale: 'en' }}
                        t={mockT}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText('Test Challenge')).toBeTruthy();
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('types.javascript')).toBeTruthy();
        expect(screen.getByText('difficulty.EASY')).toBeTruthy();
    });

    it('should link to correct challenge detail page', () => {
        render(
            <table>
                <tbody>
                    <ChallengeRow
                        challenge={mockChallenge}
                        index={0}
                        config={mockConfig}
                        isComingSoon={false}
                        isBoss={false}
                        params={{ locale: 'en', slug: mockChallenge.slug }}
                        t={mockT}
                    />
                </tbody>
            </table>
        );

        const links = screen.getAllByRole('link');
        // Row has multiple links (title, arrow button)
        links.forEach(link => {
            expect(link.getAttribute('href')).toBe('/$locale/challenges/$slug');
            const params = JSON.parse(link.getAttribute('data-params') || '{}');
            expect(params).toEqual({
                locale: 'en',
                slug: 'test-challenge'
            });
        });
    });
});
