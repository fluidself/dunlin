// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      try {
        const { jwt, requestedDeck } = req.body;

        if (!jwt || !requestedDeck) {
          return res.status(401).send('Unauthorized');
        }

        const { verified, payload } = LitJsSdk.verifyJwt({ jwt });
        // payload
        // {
        //   baseUrl: 'http://localhost:3000',
        //   chain: 'ethereum',
        //   exp: 1647268112,
        //   extraData: '',
        //   iat: 1647224912,
        //   iss: 'LIT',
        //   orgId: '',
        //   path: '/app/0x...',
        //   role: '',
        //   sub: '0x...'
        // }

        if (!verified || payload.baseUrl !== process.env.BASE_URL || payload.path !== `/app/${requestedDeck}`) {
          return res.status(401).send('Unauthorized');
        }

        req.session.allowedDeck = requestedDeck;
        await req.session.save();
        res.json({ ok: true });
      } catch (e) {
        res.json({ ok: false });
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} not allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
