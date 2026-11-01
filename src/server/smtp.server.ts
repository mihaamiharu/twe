import { Buffer } from 'node:buffer';
import { z } from 'zod';

export interface SmtpSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  opened: Promise<unknown>;
  close(): Promise<void>;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface SmtpMail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export type OpenSmtpSocket = (config: SmtpConfig) => SmtpSocket;

function hasControlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

function mailbox(value: string): { address: string; header: string } {
  if (hasControlCharacters(value)) throw new Error('Invalid SMTP address.');
  const match = /^(.*?)<([^<>]+)>$/.exec(value);
  const address = (match?.[2] ?? value).trim();
  if (
    !z.string().email().safeParse(address).success ||
    /[^\x21-\x7e]/.test(address)
  )
    throw new Error('SMTP requires an ASCII mailbox address.');
  const name = match?.[1]?.trim();
  return {
    address,
    header: name ? `${encodedHeader(name)} <${address}>` : address,
  };
}

function encodedHeader(value: string): string {
  if (hasControlCharacters(value) || value.length > 400)
    throw new Error('Invalid SMTP header.');
  const chunks: string[] = [];
  let chunk = '';
  for (const character of value) {
    if (Buffer.byteLength(chunk + character, 'utf8') > 42) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += character;
  }
  chunks.push(chunk);
  return chunks
    .map((part) => `=?UTF-8?B?${Buffer.from(part).toString('base64')}?=`)
    .join('\r\n ');
}

function encodedBody(value: string): string {
  return (
    Buffer.from(value, 'utf8')
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? ''
  );
}

function prepareMail(mail: SmtpMail) {
  if (
    Buffer.byteLength(mail.html) + Buffer.byteLength(mail.text ?? '') >
    524_288
  )
    throw new Error('SMTP message is too large.');
  const from = mailbox(mail.from);
  const to = mailbox(mail.to);
  const boundary = `twe-${crypto.randomUUID()}`;
  const lines = [
    `From: ${from.header}`,
    `To: ${to.header}`,
    `Subject: ${encodedHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${from.address.split('@')[1]}>`,
    ...(mail.replyTo ? [`Reply-To: ${mailbox(mail.replyTo).header}`] : []),
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    ...(mail.text === undefined
      ? []
      : [
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: base64',
          '',
          encodedBody(mail.text),
        ]),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody(mail.html),
    `--${boundary}--`,
    '',
  ];
  return {
    from: from.address,
    to: to.address,
    data: `${lines.join('\r\n').replace(/(^|\r\n)\./g, '$1..')}.\r\n`,
  };
}

// A bounded, one-message implicit-TLS submission session. No pooling, plaintext
// downgrade, automatic retries or server-response/credential logging.
export async function sendSmtpMail(
  config: SmtpConfig,
  mail: SmtpMail,
  openSocket: OpenSmtpSocket,
  timeoutMs = 20_000,
): Promise<void> {
  if (
    config.port !== 465 ||
    config.host.length > 253 ||
    !/^[a-z0-9.-]+$/i.test(config.host) ||
    !config.host.includes('.') ||
    config.host
      .split('.')
      .some(
        (label) =>
          !label ||
          label.length > 63 ||
          label.startsWith('-') ||
          label.endsWith('-'),
      ) ||
    !config.user ||
    !config.password ||
    hasControlCharacters(config.user + config.password)
  )
    throw new Error('SMTP requires a TLS hostname, port 465 and credentials.');
  const message = prepareMail(mail);
  if (message.from.toLowerCase() !== config.user.toLowerCase())
    throw new Error('SMTP sender must match the configured mailbox.');
  const socket = openSocket(config);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      exchange(socket, config, message),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('SMTP delivery timed out.')),
          timeoutMs,
        );
      }),
    ]);
  } catch {
    // The provider may echo user data or authentication material in its errors.
    // Do not propagate the raw error, and never retry an ambiguous DATA outcome.
    throw new Error(
      'SMTP delivery failed or its acceptance could not be confirmed.',
    );
  } finally {
    if (timer) clearTimeout(timer);
    await socket.close().catch(() => undefined);
  }
}

async function exchange(
  socket: SmtpSocket,
  config: SmtpConfig,
  message: { from: string; to: string; data: string },
) {
  await socket.opened;
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  async function reply(expected: number[]): Promise<string[]> {
    const lines: string[] = [];
    let bytes = 0;
    let code: string | undefined;
    while (true) {
      const end = buffer.indexOf('\r\n');
      if (end < 0) {
        const next = await reader.read();
        if (next.done) throw new Error('SMTP disconnected.');
        bytes += next.value.byteLength;
        if (bytes > 16_384) throw new Error('SMTP reply too large.');
        buffer += decoder.decode(next.value, { stream: true });
        continue;
      }
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const match = /^(\d{3})([ -])(.*)$/.exec(line);
      if (
        !match ||
        line.length > 1024 ||
        lines.length >= 100 ||
        (code && match[1] !== code)
      )
        throw new Error('Invalid SMTP reply.');
      code = match[1];
      lines.push(line);
      if (match[2] === ' ') {
        if (!expected.includes(Number(code)))
          throw new Error('SMTP command rejected.');
        return lines;
      }
    }
  }
  async function command(value: string, expected: number[]) {
    await writer.write(encoder.encode(`${value}\r\n`));
    return reply(expected);
  }
  try {
    await reply([220]);
    const capabilities = await command('EHLO testingwithekki.com', [250]);
    if (!capabilities.some((line) => /^250[ -]AUTH[ =].*\bPLAIN\b/i.test(line)))
      throw new Error('SMTP server does not advertise TLS AUTH PLAIN.');
    const authentication = Buffer.from(
      `\0${config.user}\0${config.password}`,
    ).toString('base64');
    const authReply = await command(`AUTH PLAIN ${authentication}`, [235, 334]);
    if (authReply.at(-1)?.startsWith('334 '))
      await command(authentication, [235]);
    await command(`MAIL FROM:<${message.from}>`, [250]);
    await command(`RCPT TO:<${message.to}>`, [250, 251]);
    await command('DATA', [354]);
    await writer.write(encoder.encode(message.data));
    await reply([250]);
    // Acceptance is final. Close the socket rather than allowing a failed QUIT
    // round trip to turn a confirmed delivery into a retryable application error.
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}
