import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getConsent = createServerFn({ method: 'GET' }).handler(
  (): 'granted' | 'denied' | null => {
    try {
      const headers = getRequestHeaders() as Headers;
      const cookieHeader = headers.get('cookie');
      if (!cookieHeader) return null;

      const cookieValue = cookieHeader
        .split('; ')
        .find((row: string) => row.startsWith('twe-consent='))
        ?.split('=')[1];

      if (cookieValue === 'granted' || cookieValue === 'denied') {
        return cookieValue as 'granted' | 'denied';
      }
    } catch (error) {
      console.error('[Consent] Failed to get consent from cookie:', error);
    }

    return null;
  },
);
