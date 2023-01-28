import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { extract } from '@extractus/oembed-extractor';
import { ironOptions } from 'constants/iron-session';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      res.status(500).json({ message: 'URL is required' });
      return;
    }

    const data = await extract(url);

    res.status(200).json({ oembed: data });
  } catch (e) {
    res.status(200).json({ oembed: undefined });
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
