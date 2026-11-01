declare module 'cloudflare:sockets' {
  export function connect(
    address: { hostname: string; port: number },
    options: { secureTransport: 'on'; allowHalfOpen: false },
  ): import('./server/smtp.server').SmtpSocket & { closed: Promise<void> };
}

declare module 'cloudflare:workers' {
  // Keep the application-facing Web API types aligned with DOM/Bun. Importing
  // the complete Worker globals here introduces a second Request/Stream family.
  export abstract class DurableObject<Env> {
    constructor(
      ctx: import('@cloudflare/workers-types').DurableObjectState,
      env: Env,
    );
    protected readonly ctx: import('@cloudflare/workers-types').DurableObjectState;
    protected readonly env: Env;
    abstract fetch(request: Request): Promise<Response>;
  }
  export const env: import('./runtime/env').RuntimeEnv;
}
