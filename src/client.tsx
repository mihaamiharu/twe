import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

// import * as Sentry from "@sentry/react";
// import { getSentryConfig } from "./lib/sentry.config";

// Sentry.init(getSentryConfig()); // Moved to CookieConsent

hydrateRoot(document, <StartClient />)
