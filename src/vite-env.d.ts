/// <reference types="vite/client" />

import type { MewlHostBridge } from "./runtime";

declare global {
  interface Window {
    mewlHost?: MewlHostBridge;
  }
}
