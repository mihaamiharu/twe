import { createStart } from '@tanstack/react-start';
import { responsePolicyMiddleware } from './server/response-policy.mw';

export const startInstance = createStart(() => ({
  requestMiddleware: [responsePolicyMiddleware],
}));
