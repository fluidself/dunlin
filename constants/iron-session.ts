import type { IronSessionOptions } from 'iron-session';

export const ironOptions: IronSessionOptions = {
  password: process.env.COOKIE_PASSWORD as string,
  cookieName: 'dunlin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
