import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

export const getConsent = createServerFn({ method: 'GET' }).handler(
  (): 'granted' | 'denied' | null => {
    try {
      const cookieHeader = getRequestHeader('cookie');
      if (!cookieHeader) return null;

      const cookieValue = cookieHeader
        .split('; ')
        .find((row) => row.startsWith('twe-consent='))
        ?.split('=')[1];

      if (cookieValue === 'granted' || cookieValue === 'denied') {
        return cookieValue;
      }
    } catch (error) {
      console.error('[Consent] Failed to get consent from cookie:', error);
    }

    return null;
  },
);
