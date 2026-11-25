import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { PreviewHeader } from '@/components/challenges/preview/preview-header';
import * as previewStateModule from '@/components/challenges/preview/use-preview-state';
import { PlaygroundHeader } from '@/components/challenges/playground/playground-header';
import {
  PlaygroundDesktopLayout,
  demoteInstructionHeadings,
} from '@/components/challenges/playground/playground-desktop-layout';
import { PlaygroundMobileLayout } from '@/components/challenges/playground/playground-mobile-layout';
import {
  LearningPathPreview,
  getLearningPathPreviewKind,
} from '@/components/learning-path-preview';
import {
  createChallenge,
  createPlaygroundState,
} from '@/tests/fixtures/playground';
import type { ChallengeExecution } from '@/components/challenges/playground/use-challenge-execution';
import type { TutorialListResponse } from '@/lib/tutorials.query';

const mockExecution: ChallengeExecution = {
  handleRunCode: mock(() => Promise.resolve()),
  handleValidateSelector: mock(),
  handleReset: mock(),
  handleSubmit: mock(),
  confirmReset: mock(() => Promise.resolve()),
  handleSelectorChange: mock(),
  handleFileChange: mock(),
  handleSelectFile: mock(),
  handleCloseFile: mock(),
  handlePreviewValidation: mock(),
  hintMutation: { isPending: false, mutate: mock() },
};

const selectorChallenge = createChallenge({
  id: 'css-101',
  slug: 'css-selector-101-id-class',
  title: 'Read an ID Selector',
  description: 'Read CSS ID and class syntax.',
  type: 'CSS_SELECTOR',
  difficulty: 'Easy',
  xp: 10,
  instructions: [
    '# Read an ID Selector',
    '',
    '## Scenario',
    'Select the button whose ID is `login-btn`.',
    '',
    '```css',
    '#login-btn { color: red; }',
    '```',
    '',
    '```bash',
    '# Keep shell comments intact',
    'echo ok',
    '```',
    '',
    '## Your task',
    'Write `#login-btn`.',
  ].join('\n'),
  htmlContent: '<div class="login-wrapper"><button id="login-btn">Login</button></div>',
  targetSelector: '#login-btn',
  starterCode: '',
});

const fourModuleCatalog: TutorialListResponse = {
  success: true,
  data: [
    {
      id: 'l-1',
      slug: 'universal-mindset',
      title: 'Universal Mindset',
      description: 'Foundations.',
      order: 1,
      module: {
        slug: 'automation-judgment',
        order: 1,
        title: 'Automation Foundations & Judgment',
        description: 'Judge candidates.',
        outcome: 'Define state, action, and evidence.',
      },
      moduleOrder: 1,
      kind: 'core',
      estimatedMinutes: 15,
      tags: ['foundations'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: false,
    },
    {
      id: 'l-2',
      slug: 'html-element-anatomy',
      title: 'HTML Element Anatomy',
      description: 'Read HTML.',
      order: 2,
      module: {
        slug: 'read-the-ui',
        order: 2,
        title: 'Read the Web UI',
        description: 'Read semantic HTML and DOM.',
        outcome: 'Inspect semantic controls.',
      },
      moduleOrder: 1,
      kind: 'core',
      estimatedMinutes: 18,
      tags: ['html'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: false,
    },
    {
      id: 'l-3',
      slug: 'first-playwright-test',
      title: 'First Playwright Test',
      description: 'Write a first test.',
      order: 3,
      module: {
        slug: 'first-test-code',
        order: 3,
        title: 'First Test & Just-Enough Code',
        description: 'Write JS/TS and Playwright.',
        outcome: 'Explain intent, API, and test data.',
      },
      moduleOrder: 1,
      kind: 'core',
      estimatedMinutes: 18,
      tags: ['playwright'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: false,
    },
    {
      id: 'l-4',
      slug: 'playwright-locator-strategy',
      title: 'Playwright Locator Strategy',
      description: 'Choose reliable locators.',
      order: 4,
      module: {
        slug: 'reliable-locators',
        order: 4,
        title: 'Reliable Locators & Testability',
        description: 'Own locator contracts.',
        outcome: 'Choose resilient accessible locators.',
      },
      moduleOrder: 1,
      kind: 'core',
      estimatedMinutes: 20,
      tags: ['locators'],
      relatedChallenges: [],
      practice: [],
      isPublished: true,
      viewCount: 0,
      isCompleted: false,
    },
  ],
  meta: {
    availableTags: ['foundations', 'html', 'playwright', 'locators'],
    modules: [
      {
        slug: 'automation-judgment',
        order: 1,
        title: 'Automation Foundations & Judgment',
        description: 'Judge candidates.',
        outcome: 'Define state, action, and evidence.',
        coreLessons: 1,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
      {
        slug: 'read-the-ui',
        order: 2,
        title: 'Read the Web UI',
        description: 'Read semantic HTML and DOM.',
        outcome: 'Inspect semantic controls.',
        coreLessons: 1,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
      {
        slug: 'first-test-code',
        order: 3,
        title: 'First Test & Just-Enough Code',
        description: 'Write JS/TS and Playwright.',
        outcome: 'Explain intent, API, and test data.',
        coreLessons: 1,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
      {
        slug: 'reliable-locators',
        order: 4,
        title: 'Reliable Locators & Testability',
        description: 'Own locator contracts.',
        outcome: 'Choose resilient accessible locators.',
        coreLessons: 1,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
    ],
    completion: {
      coreLessons: 4,
      completedCoreLessons: 0,
      corePractice: 0,
      completedCorePractice: 0,
      isCompleted: false,
    },
  },
  pagination: { page: 1, limit: 4, total: 4, totalPages: 1 },
};

describe('Issue #268: Practice workspace a11y, landmarks, and Learn previews', () => {
  beforeEach(() => {
    // Avoid Happy DOM's iframe srcdoc script execution loop while keeping
    // real WebComponentPreview and PreviewHeader rendering intact.
    spyOn(previewStateModule, 'usePreviewState').mockReturnValue({
      zoom: 100,
      setZoom: mock(),
      hoveredElement: null,
      viewMode: 'preview',
      setViewMode: mock(),
      isFullscreen: false,
      setIsFullscreen: mock(),
      handleZoomIn: mock(),
      handleZoomOut: mock(),
    });
  });

  afterEach(() => {
    cleanup();
    mock.restore();
  });

  describe('demoteInstructionHeadings', () => {
    it('demotes markdown headings outside code fences while preserving fenced comments and CSS IDs', () => {
      const result = demoteInstructionHeadings(selectorChallenge.instructions);

      expect(result).toContain('## Read an ID Selector');
      expect(result).toContain('### Scenario');
      expect(result).toContain('### Your task');
      expect(result).not.toMatch(/^# Read an ID Selector/m);
      expect(result).toContain('#login-btn { color: red; }');
      expect(result).toContain('# Keep shell comments intact');
    });
  });

  describe('Practice workspace single <h1> and tabpanel semantics', () => {
    it('renders only one <h1> across desktop PlaygroundHeader and instructions markdown', () => {
      const state = createPlaygroundState({
        activeTab: 'instructions',
        isCodeChallenge: false,
        isSelectorChallenge: true,
        isMobile: false,
      });

      const { container } = render(
        <div>
          <PlaygroundHeader
            challenge={selectorChallenge}
            locale="en"
            isMobile={false}
            isCodeChallenge={false}
            isRunning={false}
            hasPassed={false}
            hintUsed={false}
            isHintPending={false}
            onRunCode={mock()}
            onOpenHintDialog={mock()}
            onSubmit={mock()}
            revealedHintsCount={0}
            setRevealedHintsCount={mock()}
          />
          <PlaygroundDesktopLayout
            challenge={selectorChallenge}
            state={state}
            execution={mockExecution}
            previewIframeRef={createRef<HTMLIFrameElement>()}
          />
        </div>,
      );

      const h1s = container.querySelectorAll('h1');
      expect(h1s).toHaveLength(1);
      expect(h1s[0]?.textContent).toBe('Read an ID Selector');

      const h2s = Array.from(container.querySelectorAll('h2')).map(
        (el) => el.textContent,
      );
      expect(h2s).toContain('Read an ID Selector');
    });

    it('renders only one <h1> across mobile PlaygroundHeader and instructions markdown', () => {
      const state = createPlaygroundState({
        activeTab: 'instructions',
        isCodeChallenge: false,
        isSelectorChallenge: true,
        isMobile: true,
      });

      const { container } = render(
        <div>
          <PlaygroundHeader
            challenge={selectorChallenge}
            locale="en"
            isMobile={true}
            isCodeChallenge={false}
            isRunning={false}
            hasPassed={false}
            hintUsed={false}
            isHintPending={false}
            onRunCode={mock()}
            onOpenHintDialog={mock()}
            onSubmit={mock()}
            revealedHintsCount={0}
            setRevealedHintsCount={mock()}
          />
          <PlaygroundMobileLayout
            challenge={selectorChallenge}
            state={state}
            execution={mockExecution}
            previewIframeRef={createRef<HTMLIFrameElement>()}
          />
        </div>,
      );

      const h1s = container.querySelectorAll('h1');
      expect(h1s).toHaveLength(1);
      expect(h1s[0]?.textContent).toBe('Read an ID Selector');
    });

    it('keeps inactive Target Preview tabpanel hidden without flex display stacking', () => {
      const state = createPlaygroundState({
        activeTab: 'instructions',
        isCodeChallenge: false,
        isSelectorChallenge: true,
        isMobile: false,
      });

      const { container } = render(
        <PlaygroundDesktopLayout
          challenge={selectorChallenge}
          state={state}
          execution={mockExecution}
          previewIframeRef={createRef<HTMLIFrameElement>()}
        />,
      );

      const allPanels = Array.from(
        container.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
      );
      const activePanels = allPanels.filter(
        (panel) => panel.getAttribute('data-state') === 'active',
      );
      const inactivePanels = allPanels.filter(
        (panel) => panel.getAttribute('data-state') === 'inactive',
      );

      expect(activePanels).toHaveLength(1);
      expect(activePanels[0]?.hidden).toBe(false);

      expect(inactivePanels).toHaveLength(1);
      expect(inactivePanels[0]?.hidden).toBe(true);
      expect(inactivePanels[0]?.className).toContain('data-[state=inactive]:hidden');
      expect(inactivePanels[0]?.className).toContain('data-[state=active]:flex');
      expect(inactivePanels[0]?.className.split(/\s+/)).not.toContain('flex');
    });

    it('activates Target Preview tabpanel and hides instructions when preview tab is active', () => {
      const state = createPlaygroundState({
        activeTab: 'preview',
        isCodeChallenge: false,
        isSelectorChallenge: true,
        isMobile: false,
      });

      const { container } = render(
        <PlaygroundDesktopLayout
          challenge={selectorChallenge}
          state={state}
          execution={mockExecution}
          previewIframeRef={createRef<HTMLIFrameElement>()}
        />,
      );

      const activePanels = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[role="tabpanel"][data-state="active"]',
        ),
      );
      expect(activePanels).toHaveLength(1);
      expect(activePanels[0]?.hidden).toBe(false);
      expect(screen.getByTestId('preview-inspect-badge').textContent).toContain(
        'Inspect Active',
      );
      expect(screen.getByTestId('preview-zoom-value').textContent).toBe('100%');
    });
  });

  describe('PreviewHeader non-clipping toolbar layout', () => {
    it('keeps Inspect Active unclipped and zoom controls interactive in a wrapping toolbar', () => {
      const setViewMode = mock();
      const handleZoomIn = mock();
      const handleZoomOut = mock();

      render(
        <PreviewHeader
          viewMode="preview"
          setViewMode={setViewMode}
          zoom={100}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          showControls={true}
        />,
      );

      const header = screen.getByTestId('preview-header');
      expect(header.className).toContain('flex-wrap');

      const inspectBadge = screen.getByTestId('preview-inspect-badge');
      expect(inspectBadge.textContent).toContain('Inspect Active');
      expect(inspectBadge.className).toContain('whitespace-nowrap');
      expect(inspectBadge.className).toContain('shrink-0');
      expect(
        Boolean(inspectBadge.parentElement?.closest('.overflow-hidden')),
      ).toBe(false);

      const zoomValue = screen.getByTestId('preview-zoom-value');
      expect(zoomValue.textContent).toBe('100%');
      expect(zoomValue.className).toContain('whitespace-nowrap');

      fireEvent.click(screen.getByLabelText('Zoom In'));
      fireEvent.click(screen.getByLabelText('Zoom Out'));
      fireEvent.click(screen.getByLabelText('View Source'));

      expect(handleZoomIn).toHaveBeenCalledTimes(1);
      expect(handleZoomOut).toHaveBeenCalledTimes(1);
      expect(setViewMode).toHaveBeenCalledWith('source');
    });
  });

  describe('Nested <main> landmark removal', () => {
    beforeEach(() => {
      globalThis.mockLoaderData = fourModuleCatalog;
      globalThis.mockSearchParams = {};
      globalThis.mockUseQuery.mockImplementation((options) => {
        if (options.queryKey?.[0] === 'auth') {
          return { data: { user: null } };
        }
        return { data: fourModuleCatalog };
      });
    });

    it('renders LearnPage without a nested <main> landmark', async () => {
      const { default: LearnPage } = await import('@/routes/$locale/learn');
      const { container } = render(<LearnPage />);

      expect(container.querySelectorAll('main')).toHaveLength(0);
    });

    it('ensures learn, lesson detail, and leaderboard routes contain no <main> wrappers while __root owns the sole <main>', () => {
      const rootDir = process.cwd();
      const routeFilesWithoutMain = [
        'src/routes/$locale/learn/index.tsx',
        'src/routes/$locale/learn/$slug.tsx',
        'src/routes/$locale/leaderboard.tsx',
      ];

      for (const relPath of routeFilesWithoutMain) {
        const source = readFileSync(resolve(rootDir, relPath), 'utf8');
        expect(source).not.toMatch(/<main[\s>]/);
      }

      const rootSource = readFileSync(
        resolve(rootDir, 'src/routes/__root.tsx'),
        'utf8',
      );
      expect(rootSource.match(/<main[\s>]/g)?.length).toBe(1);
    });
  });

  describe('LearningPathPreview module alignment', () => {
    it('maps the first four curriculum modules to aligned preview kinds', () => {
      expect(getLearningPathPreviewKind('automation-judgment', 0)).toBe(
        'judgment',
      );
      expect(getLearningPathPreviewKind('read-the-ui', 1)).toBe('dom');
      expect(getLearningPathPreviewKind('first-test-code', 2)).toBe(
        'first-test',
      );
      expect(getLearningPathPreviewKind('reliable-locators', 3)).toBe(
        'locators',
      );
    });

    it('renders semantic HTML/DOM preview for Module 2 (Read the Web UI) instead of user.js', () => {
      const { container } = render(<LearningPathPreview kind="dom" />);
      const text = container.textContent ?? '';

      expect(container.firstElementChild?.getAttribute('data-preview-kind')).toBe(
        'dom',
      );
      expect(text).toContain('index.html');
      expect(text).toContain('<button>');
      expect(text).not.toContain('user.js');
    });

    it('renders aligned previews for all four highlighted modules on LearnPage', async () => {
      globalThis.mockLoaderData = fourModuleCatalog;
      globalThis.mockSearchParams = {};
      globalThis.mockUseQuery.mockImplementation((options) => {
        if (options.queryKey?.[0] === 'auth') {
          return { data: { user: null } };
        }
        return { data: fourModuleCatalog };
      });

      const { default: LearnPage } = await import('@/routes/$locale/learn');
      render(<LearnPage />);

      const step1 = screen.getByTestId('learning-path-step-01');
      const step2 = screen.getByTestId('learning-path-step-02');
      const step3 = screen.getByTestId('learning-path-step-03');
      const step4 = screen.getByTestId('learning-path-step-04');

      expect(
        step1.querySelector('[data-preview-kind]')?.getAttribute('data-preview-kind'),
      ).toBe('judgment');
      expect(
        step2.querySelector('[data-preview-kind]')?.getAttribute('data-preview-kind'),
      ).toBe('dom');
      expect(step2.textContent ?? '').not.toContain('user.js');
      expect(step2.textContent ?? '').toContain('<button>');

      expect(
        step3.querySelector('[data-preview-kind]')?.getAttribute('data-preview-kind'),
      ).toBe('first-test');
      expect(step3.textContent ?? '').toContain('first.spec.ts');

      expect(
        step4.querySelector('[data-preview-kind]')?.getAttribute('data-preview-kind'),
      ).toBe('locators');
      expect(step4.textContent ?? '').toContain('getByRole');
    });
  });
});
