import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as Sentry from '@sentry/react';
import { getSentryConfig } from '@/lib/sentry.config';
import { Link, useParams } from '@tanstack/react-router';

interface CookieConsentProps {
    onConsentChange: (consent: 'granted' | 'denied' | null) => void;
    initialConsent?: 'granted' | 'denied' | null;
}

export function CookieConsent({ onConsentChange, initialConsent }: CookieConsentProps) {
    const { locale } = useParams({ strict: false });
    const currentLocale = locale || 'en';
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // If we have initial consent from SSR/Context, we don't need to show the popup
        if (initialConsent === 'granted' || initialConsent === 'denied') {
            onConsentChange(initialConsent);
            
            if (initialConsent === 'granted' && !Sentry.isInitialized()) {
                Sentry.init(getSentryConfig());
            }
            return;
        }

        // If no initial consent, show the popup
        setIsVisible(true);
        onConsentChange(null);
    }, [onConsentChange, initialConsent]);

    const handleAccept = () => {
        const consent = 'granted';
        document.cookie = `twe-consent=${consent}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        onConsentChange(consent);
        if (!Sentry.isInitialized()) {
            Sentry.init(getSentryConfig());
        }
        setIsVisible(false);
    };

    const handleDecline = () => {
        const consent = 'denied';
        document.cookie = `twe-consent=${consent}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
        onConsentChange(consent);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Card className="border-primary/20 shadow-2xl bg-card/95 backdrop-blur-sm">
                <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm">We value your privacy</h3>
                        <p className="text-xs text-muted-foreground">
                            We use cookies to improve your experience and analyze extensive traffic.
                            Review our <Link to="/$locale/privacy" params={{ locale: currentLocale }} className="underline hover:text-primary">Privacy Policy</Link>.
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={handleDecline} className="text-xs h-8">
                            Decline
                        </Button>
                        <Button size="sm" onClick={handleAccept} className="text-xs h-8">
                            Accept All
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
