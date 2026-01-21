import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { getRouter } from './router'

const router = getRouter()

import * as Sentry from "@sentry/react";
import { getSentryConfig } from "./lib/sentry.config";

Sentry.init(getSentryConfig());

hydrateRoot(document, <StartClient router={router} />)
