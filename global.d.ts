// global.d.ts
import type { SolarResult } from "./lib/solarEngine";

declare global {
  // Extend globalThis with our store
  // so TypeScript stops complaining.
  var __solarStore: Map<string, SolarResult> | undefined;
}

export {};
