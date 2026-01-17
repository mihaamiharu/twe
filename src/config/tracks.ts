import { getTierFromCategory } from '@/lib/constants';

export type TrackId = 'all' | 'selectors' | 'javascript' | 'core' | 'e2e';

interface ChallengeLike {
    type: string;
    category: string | null | undefined;
}

export interface TrackConfig {
    id: TrackId;
    label: string;
    description: string;
    match: (challenge: ChallengeLike) => boolean;
}

export interface TrackGroup {
    title: string;
    tracks: TrackId[];
}

export const TRACK_CONFIG: Record<TrackId, Omit<TrackConfig, 'id'>> = {
    all: {
        label: 'All Challenges',
        description: 'Overview of all available challenges',
        match: () => true,
    },
    selectors: {
        label: 'Selectors',
        description: 'Master CSS Selectors and XPath',
        match: (c) =>
            ['CSS_SELECTOR', 'XPATH_SELECTOR'].includes(c.type) ||
            getTierFromCategory(c.category ?? undefined) === 'basic',
    },
    javascript: {
        label: 'JavaScript',
        description: 'JavaScript & DOM Fundamentals',
        match: (c) =>
            c.type === 'JAVASCRIPT' ||
            getTierFromCategory(c.category ?? undefined) === 'beginner',
    },
    core: {
        label: 'Core',
        description: 'Navigation, Locators, Actions & Assertions',
        match: (c) => {
            const cat = c.category ?? '';
            return (
                c.type === 'PLAYWRIGHT' &&
                (cat.startsWith('playwright-navigation') ||
                    cat.startsWith('playwright-locators') ||
                    cat.startsWith('playwright-assertions') ||
                    cat.startsWith('playwright-waits'))
            );
        },
    },
    e2e: {
        label: 'E2E Testing',
        description: 'Full E2E Flows & Real Scenarios',
        match: (c) => {
            return getTierFromCategory(c.category ?? undefined) === 'e2e';
        },
    },
};

export const SIDEBAR_GROUPS: TrackGroup[] = [
    {
        title: 'Overview',
        tracks: ['all'],
    },
    {
        title: 'Core Skills',
        tracks: ['selectors', 'javascript'],
    },
    {
        title: 'Playwright',
        tracks: ['core', 'e2e'],
    },
];

export const TRACK_IDS = Object.keys(TRACK_CONFIG) as [TrackId, ...TrackId[]];
