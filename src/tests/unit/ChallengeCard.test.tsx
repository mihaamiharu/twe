import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';

import { ChallengeListCard } from '@/components/challenges/challenge-list-card';

describe('ChallengeListCard', () => {
    afterEach(() => {
        cleanup();
    });

    const mockChallenge = {
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
            <ChallengeListCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={false}
                isBoss={false}
                params={{ locale: 'en', slug: mockChallenge.slug }}
                t={mockT}
            />
        );

        expect(screen.getByText('Test Challenge')).toBeTruthy();
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('difficulty.EASY')).toBeTruthy();
        expect(screen.getByText('10')).toBeTruthy();
    });

    it('should show completed state', () => {
        render(
            <ChallengeListCard
                challenge={{ ...mockChallenge, isCompleted: true }}
                config={mockConfig}
                isComingSoon={false}
                isBoss={false}
                params={{ locale: 'en', slug: mockChallenge.slug }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show boss styling', () => {
        render(
            <ChallengeListCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={false}
                isBoss={true}
                params={{ locale: 'en', slug: mockChallenge.slug }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show coming soon state', () => {
        render(
            <ChallengeListCard
                challenge={mockChallenge}
                config={mockConfig}
                isComingSoon={true}
                isBoss={false}
                params={{ locale: 'en', slug: mockChallenge.slug }}
                t={mockT}
            />
        );
        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });
});
