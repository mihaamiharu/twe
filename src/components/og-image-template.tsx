interface OgImageTemplateProps {
  title: string;
  type: string;
  difficulty: string | null;
  xp: string | null;
}

export function OgImageTemplate({
  title,
  type,
  difficulty,
  xp,
}: OgImageTemplateProps) {
  const titleSize = title.length > 110 ? 48 : title.length > 60 ? 60 : 72;
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#171918',
        color: '#F2F1EC',
        fontFamily: 'Instrument Sans',
        position: 'relative',
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, color: '#F2F1EC' }}>
          TestingWithEkki
        </div>
      </div>

      {/* Badge / Type */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 140,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#292C29',
          border: '1px solid #393C38',
          borderRadius: 8,
          padding: '8px 24px',
          fontSize: 24,
          fontWeight: 500,
          color: '#A5A69F',
        }}
      >
        {type.toUpperCase()}
      </div>

      {/* Main Title */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 212,
          height: 252,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.1,
          color: '#F2F1EC',
          width: 1040,
        }}
      >
        <div
          style={{
            display: 'block',
            width: '100%',
            maxHeight: titleSize * 3.3,
            lineClamp: 3,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>
      </div>

      {/* Description or difficulty/xp */}
      <div
        style={{
          position: 'absolute',
          bottom: 64,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {difficulty && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: 12,
              fontSize: 28,
              fontWeight: 600,
              backgroundColor:
                difficulty === 'EASY'
                  ? 'rgba(35, 133, 109, 0.15)'
                  : difficulty === 'MEDIUM'
                    ? 'rgba(183, 131, 39, 0.15)'
                    : 'rgba(199, 75, 66, 0.15)',
              color:
                difficulty === 'EASY'
                  ? '#23856D'
                  : difficulty === 'MEDIUM'
                    ? '#B78327'
                    : '#C74B42',
              border:
                difficulty === 'EASY'
                  ? '1px solid rgba(35, 133, 109, 0.3)'
                  : difficulty === 'MEDIUM'
                    ? '1px solid rgba(183, 131, 39, 0.3)'
                    : '1px solid rgba(199, 75, 66, 0.3)',
            }}
          >
            {difficulty}
          </div>
        )}

        {xp && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              fontWeight: 600,
              color: '#E65F3A',
            }}
          >
            +{xp} XP
          </div>
        )}
      </div>
    </div>
  );
}
