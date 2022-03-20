import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { generateNonce } from 'siwe';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  req.session.nonce = generateNonce();
  await req.session.save();
  res.setHeader('Content-Type', 'text/plain');
  res.send(req.session.nonce);
};

export default withIronSessionApiRoute(handler, ironOptions);
