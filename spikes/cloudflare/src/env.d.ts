import type { SpikeBindings } from './bindings';

declare global {
  namespace Cloudflare {
    interface Env extends SpikeBindings {}
  }
}
