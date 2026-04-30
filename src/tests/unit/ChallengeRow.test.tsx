import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';

import { ChallengeListRow } from '@/components/challenges/challenge-list-row';

describe('ChallengeListRow', () => {
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
        icon: <span>Icon</span>,
        label: 'JavaScript',
    };

    const mockT = (key: string) => key;

    it('should render challenge row', () => {
        render(
            <table>
                <tbody>
                    <ChallengeListRow
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

        expect(screen.getByText('Test Challenge')).toBeTruthy();
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByText('types.javascript')).toBeTruthy();
        expect(screen.getByText('difficulty.EASY')).toBeTruthy();
    });

    it('should render row number with padding', () => {
        render(
            <table>
                <tbody>
                    <ChallengeListRow
                        challenge={mockChallenge}
                        index={2}
                        config={mockConfig}
                        isComingSoon={false}
                        isBoss={false}
                        params={{ locale: 'en', slug: mockChallenge.slug }}
                        t={mockT}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText('03')).toBeTruthy();
    });

    it('should show completion indicator', () => {
        render(
            <table>
                <tbody>
                    <ChallengeListRow
                        challenge={{ ...mockChallenge, isCompleted: true }}
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

        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show coming soon state', () => {
        render(
            <table>
                <tbody>
                    <ChallengeListRow
                        challenge={mockChallenge}
                        index={0}
                        config={mockConfig}
                        isComingSoon={true}
                        isBoss={false}
                        params={{ locale: 'en', slug: mockChallenge.slug }}
                        t={mockT}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });

    it('should show boss styling', () => {
        render(
            <table>
                <tbody>
                    <ChallengeListRow
                        challenge={mockChallenge}
                        index={0}
                        config={mockConfig}
                        isComingSoon={false}
                        isBoss={true}
                        params={{ locale: 'en', slug: mockChallenge.slug }}
                        t={mockT}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText('Test Challenge')).toBeTruthy();
    });
});
