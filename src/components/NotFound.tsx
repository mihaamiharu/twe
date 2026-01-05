import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const terminalLogs = [
    '> GET /page-content ... 200 OK',
    '> Render ... Done',
    '> Visibility ... Hidden',
    '> Assertion passed: element is present',
    '> Moving to next step...',
    '> waitForSelector(".content") ... timeout',
    '> Retrying with { visible: true } ...',
    '> ERROR: Element not visible in headless mode',
    '> Checking viewport: { width: 0, height: 0 }',
    '> Screenshot saved: blank.png',
    '> Test passed (ironically)',
    '> GET /definitely-real-page ... 404',
    '> But trust us, it exists',
    '> Playwright.headless = true',
    '> User.confusion = true',
    '> Solution: Switch to headed mode',
];

export function NotFound() {
    const { t } = useTranslation('common');
    const params = useParams({ strict: false }) as { locale?: string };
    const locale = params.locale || 'en';
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
    const [isToggled, setIsToggled] = useState(false);

    useEffect(() => {
        let logIndex = 0;
        const interval = setInterval(() => {
            setVisibleLogs(prev => {
                const newLogs = [...prev, terminalLogs[logIndex % terminalLogs.length]];
                // Keep only last 8 logs for scrolling effect
                if (newLogs.length > 8) {
                    return newLogs.slice(-8);
                }
                return newLogs;
            });
            logIndex++;
        }, 800);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Circuit pattern background */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M10 10h80v80h-80z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="10" cy="10" r="3" fill="currentColor" />
                            <circle cx="90" cy="10" r="3" fill="currentColor" />
                            <circle cx="10" cy="90" r="3" fill="currentColor" />
                            <circle cx="90" cy="90" r="3" fill="currentColor" />
                            <path d="M10 50h30M60 50h30M50 10v30M50 60v30" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#circuit)" />
                </svg>
            </div>

            {/* Glowing orb effect */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* Status code badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-mono bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    ERROR 404
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {t('notFound.title')}
                </h1>

                {/* Sub-headline */}
                <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                    {t('notFound.description').split('headless: true')[0]}
                    <code className="px-2 py-0.5 bg-gray-800 rounded text-green-400 font-mono text-sm">
                        headless: true
                    </code>
                    {t('notFound.description').split('headless: true')[1]}
                </p>

                {/* Terminal window */}
                <div className="relative mx-auto max-w-lg mb-8">
                    {/* Terminal header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-t-lg border border-gray-700 border-b-0">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-2 text-xs text-gray-500 font-mono">playwright-test</span>
                    </div>

                    {/* Terminal body */}
                    <div className="relative bg-gray-950 rounded-b-lg border border-gray-700 border-t-0 p-4 h-48 overflow-hidden font-mono text-sm text-left">
                        {/* Scrolling logs */}
                        <div className="space-y-1">
                            {visibleLogs.map((log, index) => (
                                <div
                                    key={`${log}-${index}`}
                                    className={`text-green-400 transition-opacity duration-300 ${index === visibleLogs.length - 1 ? 'opacity-100' : 'opacity-70'
                                        }`}
                                >
                                    {log}
                                    {index === visibleLogs.length - 1 && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Scanline effect */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-scan" />
                    </div>

                    {/* Glow effect around terminal */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-transparent to-green-500/20 rounded-xl blur-sm -z-10" />
                </div>

                {/* Toggle switch CTA */}
                <Link to="/$locale/" params={{ locale: locale as any }} className="group inline-flex items-center gap-3">
                    <button
                        onMouseEnter={() => setIsToggled(true)}
                        onMouseLeave={() => setIsToggled(false)}
                        className="relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-full transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                    >
                        {/* Toggle switch visual */}
                        <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isToggled ? 'bg-green-300' : 'bg-gray-600'}`}>
                            <div
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isToggled ? 'left-7' : 'left-1'
                                    }`}
                            />
                        </div>
                        <span>{t('notFound.backHome')}</span>
                    </button>
                </Link>

                {/* Fun footer note */}
                <p className="mt-8 text-xs text-gray-600 font-mono">
                    {t('notFound.tip').split('--headed')[0]}
                    <code className="text-gray-500">--headed</code>
                    {t('notFound.tip').split('--headed')[1]}
                </p>
            </div>

            {/* Decorative star/cursor in corner */}
            <div className="absolute bottom-8 right-8 text-yellow-500/50">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z" />
                </svg>
            </div>
        </div>
    );
}
