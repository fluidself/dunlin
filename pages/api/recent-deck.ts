import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { deckId } = req.body;
  req.session.recentDeck = deckId;
  await req.session.save();
  res.send({ ok: true });
};

export default withIronSessionApiRoute(handler, ironOptions);
