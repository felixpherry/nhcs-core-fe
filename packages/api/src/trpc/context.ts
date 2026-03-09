// The context available to every tRPC procedure
export interface TRPCContext {
  accessToken: string | null;
  sessionId: string | null;
}

export function createContext(opts: {
  accessToken: string | null;
  sessionId: string | null;
}): TRPCContext {
  return {
    accessToken: opts.accessToken,
    sessionId: opts.sessionId,
  };
}
