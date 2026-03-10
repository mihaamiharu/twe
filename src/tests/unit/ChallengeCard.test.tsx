import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import * as router from '@tanstack/react-router';

// Mock dependencies


describe('ChallengeCard', () => {
    let ChallengeCard: any;

    beforeEach(async () => {

        // Dynamic import to get the component after mocks
        const module = await import('@/routes/$locale/challenges/index');
        ChallengeCard = module.ChallengeCard;
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
        icon: <span data-testid="icon">Icon</span>,
        label: 'JavaScript',
    };

    const mockT = (key: string) => key;

    it('should render challenge details', () => {
        render(
            <ChallengeCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={false}
                isBoss={false}
                params={{ locale: 'en' }}
                t={mockT}
            />
        );

        expect(screen.getByText('Test Challenge')).toBeTruthy();
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('difficulty.EASY')).toBeTruthy();
        expect(screen.getByText('10')).toBeTruthy(); // XP
    });

    it('should show completed state', () => {
        render(
            <ChallengeCard
                challenge={{ ...mockChallenge, isCompleted: true }}
                config={mockConfig}
                isComingSoon={false}
                isBoss={false}
                params={{ locale: 'en' }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show boss styling', () => {
        render(
            <ChallengeCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={false}
                isBoss={true}
                params={{ locale: 'en' }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show coming soon state', () => {
        render(
            <ChallengeCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={true}
                isBoss={false}
                params={{ locale: 'en' }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });
    it('should link to correct challenge detail page', () => {
        render(
            <ChallengeCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={false}
                isBoss={false}
                params={{ locale: 'en', slug: mockChallenge.slug }}
                t={mockT}
            />
        );

        const link = screen.getByRole('link');
        // Validates it uses the correct route definition
        expect(link.getAttribute('href')).toBe('/$locale/challenges/$slug');
        // Validates it passes correct params
        const params = JSON.parse(link.getAttribute('data-params') || '{}');
        expect(params).toEqual({
            locale: 'en',
            slug: 'test-challenge'
        });
    });
});
