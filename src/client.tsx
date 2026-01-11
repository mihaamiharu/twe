import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'
import { getRouter } from './router'
import { createQueryClient } from './lib/query-client'

const router = getRouter()

hydrateRoot(document, <StartClient router={router} />)
