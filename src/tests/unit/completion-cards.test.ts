import { beforeAll, describe, expect, test } from 'bun:test';
import satori from 'satori';
import { generateOgFonts } from '../../../scripts/generate-og-fonts';
import {
  buildCompletionCardFilename,
  buildCompletionCardPath,
  buildCompletionShareText,
  getEligibleCompletionCards,
  getSafeLearnerDisplayName,
  isCompletionEligible,
  isValidCompletionSlugFormat,
  normalizeCompletionKind,
  normalizeCompletionLocale,
  validateLearnerNameInput,
  WEB_AUTOMATION_TRACK_SLUG,
  type CompletionCardPayload,
} from '@/lib/completion-card';
import type { TutorialListCatalogResponse } from '@/lib/catalog.types';
import {
  resolveCompletionCardFromCatalog,
  signCompletionCardPayload,
  verifyCompletionCardSignature,
} from '@/server/completion-card.server';
import { createCompletionCardShareHandler } from '@/server/completion-card-share.server';
import { OgRenderError } from '@/server/og-errors.server';
import { renderCompletionOg } from '@/server/og-renderer.server';
import {
  getCompletionOgElement,
  getCompletionOgRenderOptions,
} from '@/server/og-template.server';
import resources from '@/server/generated/og-resources.json';
import enProfile from '@/lib/i18n/resources/en/profile.json';
import idProfile from '@/lib/i18n/resources/id/profile.json';

const TEST_SECRET = 'completion-card-unit-test-secret-0123456789abcdef';

async function expectOgErrorStatus(
  promise: Promise<unknown>,
  expectedStatus: OgRenderError['status'],
): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected OgRenderError(${expectedStatus}), but resolved`);
  } catch (error) {
    expect(error).toBeInstanceOf(OgRenderError);
    expect((error as OgRenderError).status).toBe(expectedStatus);
  }
}

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return collectKeys(value as Record<string, unknown>, fullKey);
      }
      return [fullKey];
    })
    .sort();
}

describe('Completion card validation and privacy guardrails', () => {
  test('validates kind, locale, and slug format strictly', () => {
    expect(normalizeCompletionKind('module')).toBe('module');
    expect(normalizeCompletionKind('TRACK')).toBe('track');
    expect(normalizeCompletionKind('challenge')).toBeNull();
    expect(normalizeCompletionKind('')).toBeNull();

    expect(normalizeCompletionLocale('en')).toBe('en');
    expect(normalizeCompletionLocale('ID')).toBe('id');
    expect(normalizeCompletionLocale('fr')).toBeNull();

    expect(isValidCompletionSlugFormat('automation-judgment')).toBe(true);
    expect(isValidCompletionSlugFormat(WEB_AUTOMATION_TRACK_SLUG)).toBe(true);
    expect(isValidCompletionSlugFormat('../etc/passwd')).toBe(false);
    expect(isValidCompletionSlugFormat('UPPERCASE')).toBe(false);
    expect(isValidCompletionSlugFormat('bad slug')).toBe(false);
    expect(isValidCompletionSlugFormat('a'.repeat(81))).toBe(false);
  });

  test('rejects email addresses, URLs, and control characters in learner names', () => {
    expect(validateLearnerNameInput('alice@example.com')).toEqual({
      ok: false,
      reason: 'email',
    });
    expect(validateLearnerNameInput('Alice <alice@company.co.id>')).toEqual({
      ok: false,
      reason: 'email',
    });
    expect(validateLearnerNameInput('@handle')).toEqual({
      ok: false,
      reason: 'email',
    });
    expect(validateLearnerNameInput('mailto:user@test.com')).toEqual({
      ok: false,
      reason: 'email',
    });
    expect(validateLearnerNameInput('https://evil.example')).toEqual({
      ok: false,
      reason: 'email',
    });
    expect(validateLearnerNameInput('Jane\nDoe')).toEqual({
      ok: false,
      reason: 'invalid',
    });

    // Safe display name derivation never leaks email-like strings
    expect(getSafeLearnerDisplayName('alice@example.com')).toBeNull();
    expect(getSafeLearnerDisplayName('   ')).toBeNull();
    expect(getSafeLearnerDisplayName('  Ekki   Syam  ')).toBe('Ekki Syam');
  });

  test('bounds oversized learner names without splitting grapheme clusters', () => {
    const emoji = '👩🏽‍💻';
    const result = validateLearnerNameInput('A'.repeat(46) + emoji.repeat(5));
    expect(result).toEqual({
      ok: true,
      value: 'A'.repeat(46) + emoji.repeat(2) + '…',
    });
  });

  test('builds safe filenames, paths, and share copy without PII', () => {
    expect(buildCompletionCardFilename('track', 'web-automation')).toBe(
      'testingwithekki-web-automation-track.png',
    );
    expect(buildCompletionCardFilename('module', 'read-the-ui')).toBe(
      'testingwithekki-module-read-the-ui.png',
    );
    expect(buildCompletionCardFilename('module', '../hack')).toBe(
      'testingwithekki-module-completion.png',
    );

    const anonPath = buildCompletionCardPath(
      {
        kind: 'module',
        slug: 'read-the-ui',
        locale: 'en',
        learner: null,
      },
      'sig_token_123456789012345678901234',
    );
    expect(anonPath).not.toContain('learner=');
    expect(anonPath).toContain('type=completion');
    expect(anonPath).toContain('kind=module');
    expect(anonPath).toContain('slug=read-the-ui');

    expect(
      buildCompletionShareText({
        kind: 'module',
        locale: 'id',
        title: 'Membaca Web UI',
        moduleOrder: 2,
      }),
    ).toContain('Modul 02: Membaca Web UI');
  });
});

describe('Completion eligibility logic', () => {
  test('requires non-zero work and full completion of core lessons and core practice', () => {
    expect(
      isCompletionEligible({
        coreLessons: 0,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
      }),
    ).toBe(false);

    expect(
      isCompletionEligible({
        coreLessons: 3,
        completedCoreLessons: 2,
        corePractice: 2,
        completedCorePractice: 2,
      }),
    ).toBe(false);

    expect(
      isCompletionEligible({
        coreLessons: 3,
        completedCoreLessons: 3,
        corePractice: 2,
        completedCorePractice: 1,
      }),
    ).toBe(false);

    expect(
      isCompletionEligible({
        coreLessons: 2,
        completedCoreLessons: 2,
        corePractice: 0,
        completedCorePractice: 0,
      }),
    ).toBe(true);
  });

  test('orders completed track first followed by completed modules in curriculum order', () => {
    const meta: TutorialListCatalogResponse['meta'] = {
      availableTags: [],
      modules: [
        {
          slug: 'read-the-ui',
          order: 2,
          title: 'Read the Web UI',
          description: 'Desc 2',
          outcome: 'Outcome 2',
          coreLessons: 3,
          completedCoreLessons: 3,
          corePractice: 0,
          completedCorePractice: 0,
          isCompleted: true,
        },
        {
          slug: 'automation-judgment',
          order: 1,
          title: 'Automation Foundations & Judgment',
          description: 'Desc 1',
          outcome: 'Outcome 1',
          coreLessons: 2,
          completedCoreLessons: 2,
          corePractice: 0,
          completedCorePractice: 0,
          isCompleted: true,
        },
        {
          slug: 'first-test-code',
          order: 3,
          title: 'First Test & Just-Enough Code',
          description: 'Desc 3',
          outcome: 'Outcome 3',
          coreLessons: 4,
          completedCoreLessons: 1,
          corePractice: 2,
          completedCorePractice: 0,
          isCompleted: false,
        },
      ],
      completion: {
        coreLessons: 9,
        completedCoreLessons: 6,
        corePractice: 2,
        completedCorePractice: 0,
        isCompleted: false,
      },
    };

    const partialCards = getEligibleCompletionCards(meta, 'en');
    expect(partialCards.map((card) => `${card.kind}:${card.slug}`)).toEqual([
      'module:automation-judgment',
      'module:read-the-ui',
    ]);

    const fullMeta: TutorialListCatalogResponse['meta'] = {
      ...meta,
      modules: meta.modules.map((module) => ({
        ...module,
        completedCoreLessons: module.coreLessons,
        completedCorePractice: module.corePractice,
        isCompleted: true,
      })),
      completion: {
        coreLessons: 9,
        completedCoreLessons: 9,
        corePractice: 2,
        completedCorePractice: 2,
        isCompleted: true,
      },
    };

    const fullCards = getEligibleCompletionCards(fullMeta, 'id');
    expect(fullCards[0]).toMatchObject({
      kind: 'track',
      slug: WEB_AUTOMATION_TRACK_SLUG,
      title: 'Jalur Otomasi Web',
      moduleCount: 3,
    });
    expect(fullCards).toHaveLength(4);
  });
});

describe('Completion card signing, authorization, and catalog resolution', () => {
  test('verifies HMAC signatures and rejects tampered payloads', async () => {
    const payload: CompletionCardPayload = {
      kind: 'module',
      slug: 'automation-judgment',
      locale: 'en',
      learner: 'Jane Doe',
    };
    const sig = await signCompletionCardPayload(payload, TEST_SECRET);
    expect(await verifyCompletionCardSignature(payload, sig, TEST_SECRET)).toBe(
      true,
    );
    expect(
      await verifyCompletionCardSignature(
        { ...payload, learner: 'Tampered Name' },
        sig,
        TEST_SECRET,
      ),
    ).toBe(false);
    expect(
      await verifyCompletionCardSignature(
        { ...payload, slug: 'read-the-ui' },
        sig,
        TEST_SECRET,
      ),
    ).toBe(false);
    expect(
      await verifyCompletionCardSignature(
        payload,
        sig,
        'different-secret-0123456789abcdef0123456789',
      ),
    ).toBe(false);
    expect(await verifyCompletionCardSignature(payload, '', TEST_SECRET)).toBe(
      false,
    );
  });

  test('resolves signed module and track cards from bundled catalog and rejects invalid requests', async () => {
    const modulePayload: CompletionCardPayload = {
      kind: 'module',
      slug: 'automation-judgment',
      locale: 'en',
      learner: 'Siti Rahma',
    };
    const moduleSig = await signCompletionCardPayload(
      modulePayload,
      TEST_SECRET,
    );
    const resolvedModule = await resolveCompletionCardFromCatalog(
      { ...modulePayload, sig: moduleSig },
      TEST_SECRET,
    );
    expect(resolvedModule).toMatchObject({
      kind: 'module',
      locale: 'en',
      slug: 'automation-judgment',
      moduleOrder: 1,
      title: 'Automation Foundations & Judgment',
      learner: 'Siti Rahma',
    });
    expect(resolvedModule.coreLessons).toBeGreaterThan(0);

    const trackPayload: CompletionCardPayload = {
      kind: 'track',
      slug: WEB_AUTOMATION_TRACK_SLUG,
      locale: 'id',
      learner: null,
    };
    const trackSig = await signCompletionCardPayload(trackPayload, TEST_SECRET);
    const resolvedTrack = await resolveCompletionCardFromCatalog(
      { ...trackPayload, sig: trackSig },
      TEST_SECRET,
    );
    expect(resolvedTrack).toMatchObject({
      kind: 'track',
      locale: 'id',
      slug: WEB_AUTOMATION_TRACK_SLUG,
      title: 'Jalur Otomasi Web',
      learner: null,
    });
    expect(resolvedTrack.moduleCount).toBeGreaterThanOrEqual(9);

    // Invalid kind -> 400
    await expectOgErrorStatus(
      resolveCompletionCardFromCatalog(
        {
          kind: 'achievement',
          slug: 'automation-judgment',
          locale: 'en',
          sig: moduleSig,
        },
        TEST_SECRET,
      ),
      400,
    );

    // Invalid locale -> 400
    await expectOgErrorStatus(
      resolveCompletionCardFromCatalog(
        {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'jp',
          sig: moduleSig,
        },
        TEST_SECRET,
      ),
      400,
    );

    // Email in learner -> 422
    await expectOgErrorStatus(
      resolveCompletionCardFromCatalog(
        {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          learner: 'private@user.com',
          sig: moduleSig,
        },
        TEST_SECRET,
      ),
      422,
    );

    // Missing / tampered signature -> 403
    await expectOgErrorStatus(
      resolveCompletionCardFromCatalog(
        {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          learner: 'Siti Rahma',
          sig: 'unsigned-or-invalid-signature-value-1234',
        },
        TEST_SECRET,
      ),
      403,
    );

    // Unknown module slug even with valid signature -> 404
    const fakeSlugPayload: CompletionCardPayload = {
      kind: 'module',
      slug: 'non-existent-module',
      locale: 'en',
      learner: null,
    };
    const fakeSlugSig = await signCompletionCardPayload(
      fakeSlugPayload,
      TEST_SECRET,
    );
    await expectOgErrorStatus(
      resolveCompletionCardFromCatalog(
        { ...fakeSlugPayload, sig: fakeSlugSig },
        TEST_SECRET,
      ),
      404,
    );
  });

  test('server function handler enforces auth, eligibility, and opt-in privacy', async () => {
    // Unauthenticated rejected
    const unauth = await createCompletionCardShareHandler({
      data: {
        kind: 'module',
        slug: 'automation-judgment',
        locale: 'en',
        includeName: false,
      },
      context: undefined,
    });
    expect(unauth).toEqual({ success: false, error: 'Unauthorized' });

    // Incomplete module rejected
    const incomplete = await createCompletionCardShareHandler(
      {
        data: {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          includeName: true,
        },
        context: { user: { id: 'user-1', name: 'Budi Santoso' } },
      },
      {
        checkEligibility: () =>
          Promise.resolve({ eligible: false, reason: 'not_completed' }),
      },
    );
    expect(incomplete.success).toBe(false);

    // Completed module with includeName=false omits learner name
    const anonResult = await createCompletionCardShareHandler(
      {
        data: {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          includeName: false,
        },
        context: { user: { id: 'user-1', name: 'Budi Santoso' } },
      },
      {
        checkEligibility: () =>
          Promise.resolve({
            eligible: true,
            title: 'Automation Foundations & Judgment',
            moduleOrder: 1,
            coreLessons: 2,
            corePractice: 0,
          }),
        signPayload: (payload) => signCompletionCardPayload(payload, TEST_SECRET),
      },
    );
    expect(anonResult.success).toBe(true);
    if (anonResult.success) {
      expect(anonResult.data.learner).toBeNull();
      expect(anonResult.data.imagePath).not.toContain('learner=');
      expect(anonResult.data.imagePath).not.toContain('user-1');
    }

    // Completed module with email-like user.name strips it cleanly even if includeName=true
    const emailNameResult = await createCompletionCardShareHandler(
      {
        data: {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          includeName: true,
        },
        context: { user: { id: 'user-2', name: 'secret@private.com' } },
      },
      {
        checkEligibility: () =>
          Promise.resolve({
            eligible: true,
            title: 'Automation Foundations & Judgment',
            moduleOrder: 1,
            coreLessons: 2,
            corePractice: 0,
          }),
        signPayload: (payload) => signCompletionCardPayload(payload, TEST_SECRET),
      },
    );
    expect(emailNameResult.success).toBe(true);
    if (emailNameResult.success) {
      expect(emailNameResult.data.learner).toBeNull();
      expect(emailNameResult.data.imagePath).not.toContain('secret');
      expect(emailNameResult.data.imagePath).not.toContain('@');
    }

    // Completed module with opt-in safe display name mints verifiable signed URL
    const namedResult = await createCompletionCardShareHandler(
      {
        data: {
          kind: 'module',
          slug: 'automation-judgment',
          locale: 'en',
          includeName: true,
        },
        context: { user: { id: 'user-3', name: 'Budi Santoso' } },
      },
      {
        checkEligibility: () =>
          Promise.resolve({
            eligible: true,
            title: 'Automation Foundations & Judgment',
            moduleOrder: 1,
            coreLessons: 2,
            corePractice: 0,
          }),
        signPayload: (payload) => signCompletionCardPayload(payload, TEST_SECRET),
      },
    );
    expect(namedResult.success).toBe(true);
    if (namedResult.success) {
      expect(namedResult.data.learner).toBe('Budi Santoso');
      const parsed = new URL(`https://testingwithekki.com${namedResult.data.imagePath}`);
      const resolved = await resolveCompletionCardFromCatalog(
        {
          kind: parsed.searchParams.get('kind'),
          slug: parsed.searchParams.get('slug'),
          locale: parsed.searchParams.get('locale'),
          learner: parsed.searchParams.get('learner'),
          sig: parsed.searchParams.get('sig'),
        },
        TEST_SECRET,
      );
      expect(resolved.learner).toBe('Budi Santoso');
      expect(resolved.title).toBe('Automation Foundations & Judgment');
    }
  });
});

describe('Completion card Satori + Resvg rendering and i18n parity', () => {
  beforeAll(async () => {
    await generateOgFonts();
  });

  test('renders crisp PNGs for EN/ID module and track completion cards including non-Latin names', async () => {
    const enModuleProps = {
      kind: 'module' as const,
      locale: 'en' as const,
      slug: 'reliable-locators',
      moduleOrder: 4,
      title: 'Reliable Locators & Testability',
      subtitle:
        'Turn test intent into an owned locator contract and diagnose zero or multiple matches.',
      learner: 'José García',
      coreLessons: 3,
      corePractice: 2,
    };
    const enPng = await renderCompletionOg(enModuleProps);
    expect(new DataView(enPng).getUint32(0)).toBe(0x89504e47);
    expect(enPng.byteLength).toBeGreaterThan(5000);

    const idTrackProps = {
      kind: 'track' as const,
      locale: 'id' as const,
      slug: WEB_AUTOMATION_TRACK_SLUG,
      title: 'Jalur Otomasi Web',
      subtitle:
        'Menyelesaikan seluruh pelajaran inti dan latihan praktis Playwright di TestingWithEkki.',
      learner: null,
      coreLessons: 22,
      corePractice: 14,
      moduleCount: 9,
    };
    const idPng = await renderCompletionOg(idTrackProps);
    expect(new DataView(idPng).getUint32(0)).toBe(0x89504e47);
    expect(idPng.byteLength).toBeGreaterThan(5000);

    // Non-Latin learner name exercises fallback font loading cleanly
    const jpPng = await renderCompletionOg({
      ...enModuleProps,
      learner: '佐藤花子',
    });
    expect(new DataView(jpPng).getUint32(0)).toBe(0x89504e47);
    expect(jpPng.byteLength).toBeGreaterThan(5000);

    // Verify Satori layout geometry: header above title, title above footer,
    // and every node stays inside the 1120x550 paper card bounds.
    const nodes: Array<{
      text?: string;
      left: number;
      width: number;
      top: number;
      height: number;
    }> = [];
    await satori(getCompletionOgElement(enModuleProps), {
      ...(await getCompletionOgRenderOptions(resources, enModuleProps)),
      onNodeDetected: (node) => {
        if (node.textContent) {
          nodes.push({
            text: node.textContent,
            left: node.left,
            width: node.width,
            top: node.top,
            height: node.height,
          });
        }
      },
    });
    const badge = nodes.find((node) => node.text === 'MODULE 04 COMPLETED');
    const title = nodes.find((node) =>
      node.text?.startsWith('Reliable Locators'),
    );
    const learnerNode = nodes.find((node) => node.text === 'José García');
    const domain = nodes.find((node) => node.text === 'testingwithekki.com');

    expect(badge).toBeDefined();
    expect(title).toBeDefined();
    expect(learnerNode).toBeDefined();
    expect(domain).toBeDefined();
    expect(title!.top).toBeGreaterThan(badge!.top + badge!.height);
    expect(learnerNode!.top).toBeGreaterThan(title!.top + title!.height);
    expect(domain!.top).toBeGreaterThan(learnerNode!.top + learnerNode!.height);
    for (const node of nodes) {
      expect(node.left).toBeGreaterThanOrEqual(40);
      expect(node.left + node.width).toBeLessThanOrEqual(1160);
      expect(node.top).toBeGreaterThanOrEqual(40);
      expect(node.top + node.height).toBeLessThanOrEqual(590);
    }

    // Verify OgRenderError status union preserves 400/403/404/422/503
    expect(new OgRenderError(403, 'forbidden').status).toBe(403);
  });

  test('en and id profile.json maintain exact key parity', () => {
    expect(collectKeys(enProfile)).toEqual(collectKeys(idProfile));
    expect(enProfile.completionCards).toBeDefined();
    expect(idProfile.completionCards).toBeDefined();
  });
});
