import type { SpikeBindings } from './bindings';

declare global {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Augments Cloudflare's ambient environment with the fixture bindings.
    interface Env extends SpikeBindings {}
  }
}
