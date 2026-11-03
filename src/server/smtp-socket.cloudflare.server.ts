import { connect } from 'cloudflare:sockets';
import type { OpenSmtpSocket } from './smtp.server';

export const openSmtpSocket: OpenSmtpSocket = ({ host, port }) => {
  const socket = connect(
    { hostname: host, port },
    { secureTransport: 'on', allowHalfOpen: false },
  );
  // `closed` can reject independently of opened/read/write. The protocol layer
  // reports a redacted failure and always closes this request-owned connection.
  void socket.closed.catch(() => undefined);
  return socket;
};
