import type { Flag } from '@nhcs/types';
import type { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  userName: string;
  userLevel: string;
  userGroup: string;
  accessToken: string;
  accessId: string;
  refreshToken: string;
  refExpiredDate: string;
  fgEss: Flag | null;
  fgCore: Flag | null;
  fgMss: Flag | null;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: '',
  userName: '',
  userLevel: '',
  userGroup: '',
  accessToken: '',
  accessId: '',
  refreshToken: '',
  refExpiredDate: '',
  fgEss: null,
  fgCore: null,
  fgMss: null,
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'nhcs-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours — matches old system
  },
};
