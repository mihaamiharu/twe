import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import * as Sentry from '@sentry/react';
import { getSentryConfig } from '@/lib/sentry.config';
import { Link, useParams } from '@tanstack/react-router';

interface CookieConsentProps {
    onConsentChange: (consent: 'granted' | 'denied' | null) => void;
}

export function CookieConsent({ onConsentChange }: CookieConsentProps) {
    const { locale } = useParams({ strict: false });
    const currentLocale = locale || 'en';
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const storedConsent = localStorage.getItem('twe-consent');
        if (storedConsent === 'granted') {
            onConsentChange('granted');
            if (!Sentry.isInitialized()) {
                Sentry.init(getSentryConfig());
            }
        } else if (storedConsent === 'denied') {
            onConsentChange('denied');
        } else {
            setIsVisible(true);
            onConsentChange(null);
        }
    }, [onConsentChange]);

    const handleAccept = () => {
        localStorage.setItem('twe-consent', 'granted');
        onConsentChange('granted');
        if (!Sentry.isInitialized()) {
            Sentry.init(getSentryConfig());
        }
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('twe-consent', 'denied');
        onConsentChange('denied');
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
