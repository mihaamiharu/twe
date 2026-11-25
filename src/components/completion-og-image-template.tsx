import type { CompletionCardRenderProps } from '@/lib/completion-card';

const PALETTE = {
  warmCanvas: '#f4f0e8',
  paperSurface: '#fbf9f4',
  graphite: '#1d1d1b',
  mutedGraphite: '#68645e',
  softBorder: '#d9d3c8',
  brandOrange: '#e65f3a',
  brandOrangeDeep: '#b23f1c',
  orangeTint: '#f7ded4',
  brandSuccess: '#23856d',
  successTint: '#e3f2ed',
} as const;

export function getCompletionCardCopy(props: CompletionCardRenderProps) {
  const isId = props.locale === 'id';
  const moduleCode =
    props.moduleOrder !== undefined
      ? String(props.moduleOrder).padStart(2, '0')
      : null;

  const badgeLabel =
    props.kind === 'track'
      ? isId
        ? 'JALUR SELESAI'
        : 'TRACK COMPLETED'
      : isId
        ? `MODUL ${moduleCode ?? ''} SELESAI`.replace(/\s+/g, ' ').trim()
        : `MODULE ${moduleCode ?? ''} COMPLETED`.replace(/\s+/g, ' ').trim();

  const eyebrow =
    props.kind === 'track'
      ? isId
        ? 'TESTINGWITHEKKI · KURIKULUM LENGKAP'
        : 'TESTINGWITHEKKI · FULL CURRICULUM'
      : isId
        ? 'OTOMASI WEB · MODUL BELAJAR'
        : 'WEB AUTOMATION · LEARNING MODULE';

  const completedByLabel = isId ? 'Diselesaikan oleh' : 'Completed by';

  const lessonLabel = isId
    ? `${props.coreLessons} Pelajaran Inti`
    : `${props.coreLessons} Core ${props.coreLessons === 1 ? 'Lesson' : 'Lessons'}`;

  const practiceLabel =
    props.corePractice > 0
      ? isId
        ? `${props.corePractice} Latihan Inti`
        : `${props.corePractice} Core Practice`
      : null;

  const modulesLabel =
    props.kind === 'track' && props.moduleCount
      ? isId
        ? `${props.moduleCount} Modul`
        : `${props.moduleCount} Modules`
      : null;

  const footerTagline = isId
    ? 'Belajar software testing praktis oleh Ekki'
    : 'Practical software testing by Ekki';

  return {
    badgeLabel,
    eyebrow,
    completedByLabel,
    lessonLabel,
    practiceLabel,
    modulesLabel,
    footerTagline,
  };
}

/**
 * Rebrand V1 warm editorial completion card for Satori + Resvg (1200x630).
 * Uses only the bundled Instrument Sans weights (400/700) and inline SVG
 * badges to stay within Cloudflare Free memory and compute budgets.
 */
export function CompletionOgImageTemplate(props: CompletionCardRenderProps) {
  const copy = getCompletionCardCopy(props);
  const titleSize =
    props.title.length > 52 ? 42 : props.title.length > 34 ? 50 : 58;

  const statChips = [
    copy.modulesLabel,
    copy.lessonLabel,
    copy.practiceLabel,
  ].filter((value): value is string => Boolean(value));

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 1200,
        height: 630,
        backgroundColor: PALETTE.warmCanvas,
        color: PALETTE.graphite,
        fontFamily: 'Instrument Sans',
      }}
    >
      {/* Elevated paper frame */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 1120,
          height: 550,
          overflow: 'hidden',
          borderRadius: 20,
          border: `1.5px solid ${PALETTE.softBorder}`,
          backgroundColor: PALETTE.paperSurface,
          boxShadow: '0 18px 40px rgba(29, 29, 27, 0.08)',
        }}
      >
        {/* Signature brand-orange top rule */}
        <div
          style={{
            display: 'flex',
            width: 1120,
            height: 8,
            backgroundColor: PALETTE.brandOrange,
          }}
        />

        {/* Inner editorial content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 1020,
            height: 472,
            marginTop: 34,
            marginBottom: 34,
            marginLeft: 50,
            marginRight: 50,
          }}
        >
          {/* Header: Brand wordmark + Completion badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'baseline',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -1.2,
              }}
            >
              <span>TestingWith</span>
              <span style={{ color: PALETTE.brandOrange }}>Ekki</span>
              <div
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: 162,
                  width: 58,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: PALETTE.brandOrange,
                  transform: 'rotate(-4deg)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                borderRadius: 999,
                backgroundColor: PALETTE.orangeTint,
                border: `1px solid ${PALETTE.brandOrange}`,
                color: PALETTE.brandOrangeDeep,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1.4,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={PALETTE.brandOrangeDeep}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{copy.badgeLabel}</span>
            </div>
          </div>

          {/* Center editorial body */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              maxWidth: 960,
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                color: PALETTE.brandOrangeDeep,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2.2,
              }}
            >
              <span>{copy.eyebrow}</span>
            </div>

            <div
              style={{
                display: 'block',
                fontSize: titleSize,
                fontWeight: 700,
                letterSpacing: -1.8,
                lineHeight: 1.08,
                color: PALETTE.graphite,
                maxHeight: titleSize * 2.4,
                lineClamp: 2,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {props.title}
            </div>

            {props.learner ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 4,
                  fontSize: 24,
                  color: PALETTE.mutedGraphite,
                }}
              >
                <span>{copy.completedByLabel}</span>
                <span
                  style={{
                    color: PALETTE.graphite,
                    fontWeight: 700,
                  }}
                >
                  {props.learner}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'block',
                  fontSize: 21,
                  lineHeight: 1.4,
                  color: PALETTE.mutedGraphite,
                  maxWidth: 860,
                  maxHeight: 62,
                  lineClamp: 2,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {props.subtitle}
              </div>
            )}
          </div>

          {/* Footer: Completed scope chips + Creator-led brand URL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: 22,
              borderTop: `1px solid ${PALETTE.softBorder}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {statChips.map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 10,
                    backgroundColor: PALETTE.warmCanvas,
                    border: `1px solid ${PALETTE.softBorder}`,
                    fontSize: 16,
                    fontWeight: 700,
                    color: PALETTE.graphite,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: PALETTE.brandSuccess,
                    }}
                  />
                  <span>{chip}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: PALETTE.graphite,
                  letterSpacing: -0.3,
                }}
              >
                testingwithekki.com
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: PALETTE.mutedGraphite,
                }}
              >
                {copy.footerTagline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
