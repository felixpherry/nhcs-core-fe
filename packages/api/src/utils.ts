import type { ProcedureMeta } from '@nhcs/registries';

// Pause execution for a given number of milliseconds
// Used between retries — e.g. sleep(1000) waits 1 second
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Returns true if the procedure is a write operation
// Mutations and commands change data — they are NOT safe to retry
export function isMutation(meta: ProcedureMeta): boolean {
  return meta.type === 'mutation' || meta.type === 'command';
}
