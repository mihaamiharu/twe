import React from 'react';

interface OgImageTemplateProps {
    title: string;
    type: string;
    difficulty: string | null;
    xp: string | null;
}

export function OgImageTemplate({ title, type, difficulty, xp }: OgImageTemplateProps) {
    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#09090b', // zinc-950
                backgroundImage: 'linear-gradient(to bottom right, #09090b, #18181b)',
                color: 'white',
                fontFamily: 'Outfit',
                position: 'relative',
            }}
        >
            {/* Background Grid Pattern - Simplified for Satori */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '1200px',
                    height: '630px',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%)',
                    backgroundSize: '50px 50px',
                    opacity: 0.2,
                }}
            />

            {/* Logo / Brand */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40, gap: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#e4e4e7' }}>TestingWithEkki</div>
            </div>

            {/* Badge / Type */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: 50,
                    padding: '8px 24px',
                    fontSize: 24,
                    fontWeight: 500,
                    color: '#a1a1aa',
                    marginBottom: 24,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
            >
                {type.toUpperCase()}
            </div>

            {/* Main Title */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: 72,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: 'white',
                    marginBottom: 24,
                    width: '80%',
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.2)',
                }}
            >
                {title}
            </div>

            {/* Description or difficulty/xp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 16 }}>
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
                                    ? 'rgba(74, 222, 128, 0.15)'
                                    : difficulty === 'MEDIUM'
                                        ? 'rgba(250, 204, 21, 0.15)'
                                        : 'rgba(248, 113, 113, 0.15)',
                            color:
                                difficulty === 'EASY'
                                    ? '#4ade80'
                                    : difficulty === 'MEDIUM'
                                        ? '#facc15'
                                        : '#f87171',
                            border:
                                difficulty === 'EASY'
                                    ? '1px solid rgba(74, 222, 128, 0.3)'
                                    : difficulty === 'MEDIUM'
                                        ? '1px solid rgba(250, 204, 21, 0.3)'
                                        : '1px solid rgba(248, 113, 113, 0.3)',
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
                            color: '#fbbf24', // amber-400
                            textShadow: '0 0 10px rgba(251, 191, 36, 0.3)',
                        }}
                    >
                        +{xp} XP
                    </div>
                )}
            </div>
        </div>
    );
}
