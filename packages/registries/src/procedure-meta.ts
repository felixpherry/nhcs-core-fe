export type ProcedureMode = 'proxy' | 'facade';

export type ProcedureType =
  | 'list'
  | 'detail'
  | 'mutation'
  | 'command'
  | 'export'
  | 'config';

export type ProcedureCriticality = 'critical' | 'degradable';

export interface ProcedureMeta {
  mode: ProcedureMode;
  type: ProcedureType;
  criticality: ProcedureCriticality;
  requestClass: `${ProcedureMode}:${ProcedureType}:${ProcedureCriticality}`;
}

interface PolicyEntry {
  timeout: number;
  maxRetries: number;
  driftBehavior: string;
  logLevel: 'info' | 'warn' | 'error';
}

const POLICY_TABLE: Record<string, PolicyEntry> = {
  // Proxy calls (hitting the .NET backend)
  'proxy:list:critical': {
    timeout: 15_000,
    maxRetries: 2,
    driftBehavior: 'dead-state',
    logLevel: 'warn',
  },
  'proxy:list:degradable': {
    timeout: 15_000,
    maxRetries: 2,
    driftBehavior: 'degrade',
    logLevel: 'info',
  },
  'proxy:detail:critical': {
    timeout: 10_000,
    maxRetries: 2,
    driftBehavior: 'dead-state',
    logLevel: 'warn',
  },
  'proxy:mutation:critical': {
    timeout: 15_000,
    maxRetries: 0,
    driftBehavior: 'blocking-error',
    logLevel: 'error',
  },
  'proxy:command:critical': {
    timeout: 30_000,
    maxRetries: 0,
    driftBehavior: 'blocking-error',
    logLevel: 'error',
  },
  'proxy:config:critical': {
    timeout: 5_000,
    maxRetries: 1,
    driftBehavior: 'block-module',
    logLevel: 'error',
  },
  'proxy:config:degradable': {
    timeout: 5_000,
    maxRetries: 1,
    driftBehavior: 'static-defaults',
    logLevel: 'warn',
  },

  // Facade calls (local/cached data)
  'facade:list:critical': {
    timeout: 2_000,
    maxRetries: 0,
    driftBehavior: 'degrade',
    logLevel: 'warn',
  },
  'facade:detail:critical': {
    timeout: 1_500,
    maxRetries: 0,
    driftBehavior: 'degrade',
    logLevel: 'warn',
  },
  'facade:config:critical': {
    timeout: 1_000,
    maxRetries: 0,
    driftBehavior: 'block-module',
    logLevel: 'error',
  },
  'facade:config:degradable': {
    timeout: 1_000,
    maxRetries: 0,
    driftBehavior: 'static-defaults',
    logLevel: 'warn',
  },
};

export function getPolicy(requestClass: string): PolicyEntry {
  const entry = POLICY_TABLE[requestClass];
  if (!entry) {
    throw new Error(`No policy for requestClass: ${requestClass}`);
  }
  return entry;
}

const registry = new Map<string, ProcedureMeta>();

export function registerProcedure(
  key: string,
  meta: Omit<ProcedureMeta, 'requestClass'>,
): ProcedureMeta {
  const requestClass =
    `${meta.mode}:${meta.type}:${meta.criticality}` as ProcedureMeta['requestClass'];
  const fullMeta: ProcedureMeta = { ...meta, requestClass };
  registry.set(key, fullMeta);
  return fullMeta;
}

export function getProcedureMeta(key: string): ProcedureMeta {
  const meta = registry.get(key);
  if (!meta) {
    throw new Error(`Procedure "${key}" not registered`);
  }
  return meta;
}
