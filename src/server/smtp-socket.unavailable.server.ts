import type { OpenSmtpSocket } from './smtp.server';

export const openSmtpSocket: OpenSmtpSocket = () => {
  throw new Error(
    'SMTP delivery requires the local or deployed workerd runtime.',
  );
};
