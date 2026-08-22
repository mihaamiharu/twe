interface HomeOgImageTemplateProps {
  inspectorImage: string;
}

/**
 * Editorial homepage share card. Keep this separate from the challenge OG
 * template so the homepage preview can tell the same Inspect → Run → Verify
 * story as the hero without turning a challenge link into a generic banner.
 */
export function HomeOgImageTemplate({
  inspectorImage,
}: HomeOgImageTemplateProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#f4f0e8',
        color: '#1d1d1b',
        fontFamily: 'Instrument Sans',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 208,
          width: 56,
          height: 3,
          borderRadius: 999,
          backgroundColor: '#e65f3a',
          transform: 'rotate(-4deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 48,
          display: 'flex',
          fontSize: 29,
          fontWeight: 700,
          letterSpacing: -1.4,
        }}
      >
        <span>TestingWith</span>
        <span style={{ color: '#e65f3a' }}>Ekki</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 166,
          left: 48,
          display: 'flex',
          flexDirection: 'column',
          width: 470,
        }}
      >
        <div
          style={{
            display: 'flex',
            marginBottom: 18,
            color: '#e65f3a',
            fontFamily: 'IBM Plex Mono',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 2.4,
          }}
        >
          PRACTICAL SOFTWARE TESTING
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: -2.8,
            lineHeight: 1.03,
          }}
        >
          <span>Grow beyond</span>
          <span>
            test execution<span style={{ color: '#e65f3a' }}>.</span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            width: 420,
            marginTop: 22,
            color: '#68645e',
            fontSize: 20,
            lineHeight: 1.35,
          }}
        >
          Grow beyond test execution with practical lessons and hands-on
          challenges for QA engineers.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 126,
          left: 560,
          display: 'flex',
          flexDirection: 'column',
          width: 560,
          height: 270,
          overflow: 'hidden',
          border: '1px solid #d9d3c8',
          borderRadius: 16,
          backgroundColor: '#fbf9f4',
          boxShadow: '0 18px 35px rgba(29, 29, 27, 0.10)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 42,
            padding: '0 18px',
            borderBottom: '1px solid #d9d3c8',
            color: '#68645e',
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
          }}
        >
          <span style={{ color: '#d65a43', fontSize: 19 }}>●</span>
          <span style={{ marginLeft: 7, color: '#b78327', fontSize: 19 }}>
            ●
          </span>
          <span style={{ marginLeft: 7, color: '#23856d', fontSize: 19 }}>
            ●
          </span>
          <span style={{ marginLeft: 18 }}>example.test / sign-in</span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 61,
            right: 25,
            display: 'flex',
            color: '#e65f3a',
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
            letterSpacing: 1.2,
          }}
        >
          01 / INSPECT
        </div>
        <div
          style={{
            position: 'absolute',
            top: 86,
            left: 42,
            display: 'flex',
            flexDirection: 'column',
            width: 300,
          }}
        >
          <div
            style={{
              height: 30,
              marginBottom: 13,
              border: '1px solid #d9d3c8',
              borderRadius: 7,
              backgroundColor: '#ffffff',
            }}
          />
          <div
            style={{
              height: 30,
              marginBottom: 14,
              border: '1px solid #d9d3c8',
              borderRadius: 7,
              backgroundColor: '#ffffff',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 45,
              borderRadius: 7,
              backgroundColor: '#e65f3a',
              color: '#fbf9f4',
              fontFamily: 'IBM Plex Mono',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Sign in
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 104,
            right: 30,
            display: 'flex',
            flexDirection: 'column',
            width: 145,
            color: '#68645e',
            fontSize: 16,
            lineHeight: 1.25,
          }}
        >
          <span style={{ color: '#1d1d1b', fontWeight: 700 }}>
            Welcome back
          </span>
          <span style={{ marginTop: 7 }}>Continue to your workspace</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 354,
          left: 724,
          display: 'flex',
          flexDirection: 'column',
          width: 388,
          height: 190,
          overflow: 'hidden',
          borderRadius: 12,
          backgroundColor: '#171918',
          color: '#f2f1ec',
          boxShadow: '0 16px 28px rgba(29, 29, 27, 0.14)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 42,
            padding: '0 16px',
            borderBottom: '1px solid #393c38',
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
          }}
        >
          <span style={{ color: '#a5a69f' }}>TWE PRACTICE</span>
          <span style={{ color: '#e65f3a' }}>02 / ▶ RUN</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '18px 20px',
            fontFamily: 'IBM Plex Mono',
            fontSize: 13,
          }}
        >
          <span style={{ color: '#a5a69f' }}>tests/login.spec.ts</span>
          <span style={{ marginTop: 13, color: '#e6b35a' }}>
            await page.getByRole('button').click()
          </span>
          <span style={{ marginTop: 11, color: '#23856d' }}>✓ test passed</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 478,
          left: 936,
          display: 'flex',
          flexDirection: 'column',
          width: 190,
          height: 111,
          padding: '14px 16px',
          border: '1px solid #d9d3c8',
          borderRadius: 12,
          backgroundColor: '#fbf9f4',
          boxShadow: '0 14px 24px rgba(29, 29, 27, 0.10)',
        }}
      >
        <span
          style={{
            color: '#e65f3a',
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
            letterSpacing: 1.1,
          }}
        >
          03 / VERIFY
        </span>
        <span
          style={{
            marginTop: 12,
            paddingTop: 9,
            borderTop: '1px solid #d9d3c8',
            color: '#68645e',
            fontFamily: 'IBM Plex Mono',
            fontSize: 12,
          }}
        >
          Expected = Actual
        </span>
        <span style={{ marginTop: 9, color: '#23856d', fontSize: 15 }}>
          ✓ PASSED
        </span>
      </div>

      <img
        src={inspectorImage}
        alt=""
        style={{
          position: 'absolute',
          top: 233,
          left: 542,
          zIndex: 5,
          width: 295,
          height: 369,
          objectFit: 'contain',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: 34,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          color: '#68645e',
          fontFamily: 'IBM Plex Mono',
          fontSize: 13,
          letterSpacing: 1.4,
        }}
      >
        <span style={{ color: '#e65f3a' }}>01 INSPECT</span>
        <span style={{ margin: '0 13px', color: '#d9d3c8' }}>→</span>
        <span style={{ color: '#e65f3a' }}>02 RUN</span>
        <span style={{ margin: '0 13px', color: '#d9d3c8' }}>→</span>
        <span style={{ color: '#e65f3a' }}>03 VERIFY</span>
      </div>
    </div>
  );
}
