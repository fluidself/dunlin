import type { Workbox } from 'workbox-window';
import type { LitCore } from '@lit-protocol/core';

declare global {
  interface Window {
    workbox: Workbox;
    litCoreClient?: LitCore;
  }
}
