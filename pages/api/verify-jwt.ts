// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

const cookieOptions = {
  httpOnly: true,
  maxAge: 2592000,
  path: '/',
  sameSite: 'Strict',
  secure: process.env.NODE_ENV === 'production',
};

function setCookie(res: any, name: string, value: string, options: Record<string, unknown> = {}): void {
  const stringValue = typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value);

  res.setHeader('Set-Cookie', serialize(name, String(stringValue), options));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jwt, requestedDeck } = JSON.parse(req.body);

  if (!jwt || !requestedDeck) {
    res.status(401).send('Unauthorized');
  }

  const { verified, payload } = LitJsSdk.verifyJwt({ jwt });

  if (!verified || payload.baseUrl !== process.env.BASE_URL || payload.path !== `/${requestedDeck}`) {
    res.status(401).send('Unauthorized');
  }

  // setCookie(res, 'accessToken', jwt, cookieOptions);
  setCookie(res, 'accessToken', jwt, { ...cookieOptions, path: `/${requestedDeck}` });
  res.status(200).json({ message: 'success' });

  // payload
  // {
  //   baseUrl: 'http://localhost:3000',
  //   chain: 'ethereum',
  //   exp: 1647268112,
  //   extraData: '',
  //   iat: 1647224912,
  //   iss: 'LIT',
  //   orgId: '',
  //   path: '/0x...',
  //   role: '',
  //   sub: '0x...'
  // }
}
