// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  try {
    const { jwt, requestedDeck } = req.body;

    if (!jwt || !requestedDeck) {
      return res.status(401).send('Unauthorized');
    }

    const { verified, payload } = LitJsSdk.verifyJwt({ jwt });

    if (!verified || payload.baseUrl !== process.env.BASE_URL || payload.path !== `/app/${requestedDeck}`) {
      return res.status(401).send('Unauthorized');
    }

    req.session.allowedDeck = requestedDeck;
    await req.session.save();
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false });
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
