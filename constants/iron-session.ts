export const ironOptions = {
  cookieName: 'siwe',
  password: process.env.NEXT_IRON_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
