// lib/resultStore.ts
import type { SolarResult } from "./solarEngine";

const store = globalThis.__solarStore ?? new Map<string, SolarResult>();
globalThis.__solarStore = store;

export function saveResult(result: SolarResult): string {
  const id = crypto.randomUUID();
  store.set(id, result);
  return id;
}

export function getResult(id: string): SolarResult | null {
  return store.get(id) ?? null;
}
