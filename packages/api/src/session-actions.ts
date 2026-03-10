import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions, defaultSession } from './session';
import type { SessionData } from './session';
import type { LoginResultData } from './routers/auth/auth.schema';

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    Object.assign(session, defaultSession);
  }

  return session;
}

export async function createSession(loginData: LoginResultData) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.userId = loginData.userId ?? '';
  session.userName = loginData.userName ?? '';
  session.userLevel = loginData.userLevel ?? '';
  session.userGroup = loginData.userGroup ?? '';
  session.accessToken = loginData.accessToken ?? '';
  session.accessId = loginData.accessId ?? '';
  session.refreshToken = loginData.refreshToken ?? '';
  session.refExpiredDate = loginData.refExpiredDate ?? '';
  session.fgEss = loginData.fgEss ?? null;
  session.fgCore = loginData.fgCore ?? null;
  session.fgMss = loginData.fgMss ?? null;
  session.isLoggedIn = true;

  await session.save();
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}
