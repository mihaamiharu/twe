import { getTierFromCategory } from '@/lib/constants';

export type TrackId = 'all' | 'selectors' | 'scripting' | 'core' | 'e2e';

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
    scripting: {
        label: 'JavaScript & TypeScript',
        description: 'Programming Fundamentals for Test Automation',
        match: (c) =>
            c.type === 'JAVASCRIPT' ||
            c.type === 'TYPESCRIPT' ||
            getTierFromCategory(c.category ?? undefined) === 'beginner' ||
            (c.category?.startsWith('ts-') ?? false),
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
        label: 'App Testing',
        description: 'Full E2E Flows, POM & Real Scenarios',
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
        tracks: ['selectors', 'scripting'],
    },
    {
        title: 'Playwright',
        tracks: ['core', 'e2e'],
    },
];

export const TRACK_IDS = Object.keys(TRACK_CONFIG) as [TrackId, ...TrackId[]];
