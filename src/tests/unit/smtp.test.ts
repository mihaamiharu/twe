/* eslint-disable @typescript-eslint/await-thenable -- Bun's asynchronous rejects matchers are typed as synchronous matchers. */
import { describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import {
  sendSmtpMail,
  type SmtpSocket,
  type SmtpMail,
} from '../../server/smtp.server';

const config = {
  host: 'mail.example.com',
  port: 465,
  user: 'admin@example.com',
  password: 'synthetic-smtp-password',
};
const mail: SmtpMail = {
  from: 'TestingWithEkki <admin@example.com>',
  to: 'reader@example.com',
  subject: 'Verify your account ⚡',
  text: 'Hello 👋\n.\nStill content',
  html: '<p>Hello 👋</p>',
  replyTo: 'reply@example.com',
};

function server(
  options: {
    rejectRecipient?: boolean;
    rejectAuth?: boolean;
    stall?: boolean;
    challenge?: boolean;
    capability?: boolean;
  } = {},
) {
  const writes: string[] = [];
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let closes = 0;
  const encoder = new TextEncoder();
  function respond(value: string) {
    // Real replies may be split at any TCP chunk boundary.
    controller.enqueue(encoder.encode(value.slice(0, 4)));
    controller.enqueue(encoder.encode(value.slice(4)));
  }
  const socket: SmtpSocket = {
    readable: new ReadableStream({
      start(value) {
        controller = value;
        if (!options.stall) respond('220 test.example ESMTP ready\r\n');
      },
    }),
    writable: new WritableStream({
      write(bytes) {
        const value = new TextDecoder().decode(bytes);
        writes.push(value);
        if (value.startsWith('EHLO '))
          respond(
            options.capability === false
              ? '250 test.example\r\n'
              : '250-test.example\r\n250-AUTH PLAIN LOGIN\r\n250 SIZE 1000000\r\n',
          );
        else if (value.startsWith('AUTH '))
          respond(
            options.rejectAuth
              ? '535 private-provider-error synthetic-smtp-password\r\n'
              : options.challenge
                ? '334 \r\n'
                : '235 authenticated\r\n',
          );
        else if (options.challenge && writes.length === 3)
          respond('235 authenticated\r\n');
        else if (value.startsWith('MAIL FROM:')) respond('250 sender ok\r\n');
        else if (value.startsWith('RCPT TO:'))
          respond(
            options.rejectRecipient
              ? '550 recipient rejected\r\n'
              : '250 recipient ok\r\n',
          );
        else if (value === 'DATA\r\n') respond('354 send message\r\n');
        else respond('250 queued\r\n');
      },
    }),
    opened: Promise.resolve(),
    close: () => {
      closes++;
      controller.close();
      return Promise.resolve();
    },
  };
  return {
    socket,
    writes,
    get closes() {
      return closes;
    },
  };
}

describe('bounded TLS SMTP submission', () => {
  test('handles fragmented multiline replies and Unicode MIME without leaking DATA boundaries', async () => {
    const smtp = server();
    await sendSmtpMail(config, mail, () => smtp.socket);
    expect(smtp.closes).toBe(1);
    expect(
      smtp.writes.some((line) => line === 'MAIL FROM:<admin@example.com>\r\n'),
    ).toBe(true);
    const data = smtp.writes.at(-1)!;
    expect(data.endsWith('\r\n.\r\n')).toBe(true);
    expect(data.split('\r\n.\r\n')).toHaveLength(2);
    expect(data).toContain(Buffer.from(mail.html).toString('base64'));
    expect(data).toContain(Buffer.from(mail.subject).toString('base64'));
    expect(data).toContain('Reply-To: reply@example.com');
    expect(data).not.toContain(config.password);
  });

  test('supports the optional AUTH PLAIN challenge', async () => {
    const smtp = server({ challenge: true });
    await sendSmtpMail(config, mail, () => smtp.socket);
    expect(smtp.writes[2]).toBe(
      `${Buffer.from(`\0${config.user}\0${config.password}`).toString('base64')}\r\n`,
    );
  });

  test('rejects authentication without exposing provider text or credentials', async () => {
    const smtp = server({ rejectAuth: true });
    await expect(sendSmtpMail(config, mail, () => smtp.socket)).rejects.toThrow(
      'SMTP delivery failed or its acceptance could not be confirmed.',
    );
    expect(smtp.writes.some((line) => line.startsWith('MAIL FROM:'))).toBe(
      false,
    );
    expect(smtp.closes).toBe(1);
  });

  test('never submits DATA or retries a rejected recipient', async () => {
    const smtp = server({ rejectRecipient: true });
    await expect(
      sendSmtpMail(config, mail, () => smtp.socket),
    ).rejects.toThrow();
    expect(
      smtp.writes.filter((line) => line.startsWith('RCPT TO:')),
    ).toHaveLength(1);
    expect(smtp.writes).not.toContain('DATA\r\n');
    expect(smtp.closes).toBe(1);
  });

  test('does not send credentials without advertised authentication support', async () => {
    const smtp = server({ capability: false });
    await expect(
      sendSmtpMail(config, mail, () => smtp.socket),
    ).rejects.toThrow();
    expect(smtp.writes).toHaveLength(1);
    expect(smtp.closes).toBe(1);
  });

  test('closes a stalled connection on its deadline', async () => {
    const smtp = server({ stall: true });
    await expect(
      sendSmtpMail(config, mail, () => smtp.socket, 20),
    ).rejects.toThrow();
    expect(smtp.closes).toBe(1);
    expect(smtp.writes).toHaveLength(0);
  });

  test('rejects header/envelope injection, sender mismatch and plaintext ports before connecting', async () => {
    let opens = 0;
    const open = () => {
      opens++;
      return server().socket;
    };
    for (const invalid of [
      { ...mail, to: 'reader@example.com>\r\nRCPT TO:<other@example.com' },
      { ...mail, subject: 'hello\r\nBcc: other@example.com' },
      { ...mail, replyTo: 'reply@example.com\r\nInjected: yes' },
      { ...mail, from: 'other@example.com' },
    ])
      await expect(sendSmtpMail(config, invalid, open)).rejects.toThrow();
    await expect(
      sendSmtpMail({ ...config, port: 25 }, mail, open),
    ).rejects.toThrow();
    expect(opens).toBe(0);
  });
});
