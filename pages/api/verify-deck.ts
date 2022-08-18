import { withIronSessionApiRoute } from 'iron-session/next';
import { unsealData } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  try {
    const { seal } = req.body;
    const unsealed = await unsealData(seal, { password: process.env.COOKIE_PASSWORD as string });

    if (!seal || !unsealed.allowedDeck) {
      return res.status(401).send('Unauthorized');
    }

    req.session.allowedDeck = unsealed.allowedDeck as string;
    await req.session.save();
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false });
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
