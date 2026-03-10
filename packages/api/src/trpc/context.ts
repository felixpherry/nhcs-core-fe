import { getSession } from '../session-actions';

export interface TRPCContext {
  accessToken: string | null;
  sessionId: string | null;
  userId: string | null;
  accessId: string | null;
  userLevel: string | null;
}

export async function createContext(): Promise<TRPCContext> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return {
      accessToken: null,
      sessionId: null,
      userId: null,
      accessId: null,
      userLevel: null,
    };
  }

  return {
    accessToken: session.accessToken,
    sessionId: session.accessId,
    userId: session.userId,
    accessId: session.accessId,
    userLevel: session.userLevel,
  };
}
