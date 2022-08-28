import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';
import { User } from 'types/supabase';
import supabase from 'lib/supabase';

const headerName = 'Cache-Control';
const headerValue = 'no-cache, no-store, max-age=0, must-revalidate';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  const address = req.session.siwe?.address;
  if (!address) {
    res.setHeader(headerName, headerValue).status(200).json({ user: null });
    return;
  }

  const { data: user } = await supabase.from<User>('users').select('*').match({ id: address }).single();

  if (user) {
    // DB user exists, return it
    req.session.user = user;
    await req.session.save();

    res.setHeader(headerName, headerValue).status(200).json({ user: user });
    return;
  } else {
    // DB user does not exist, create and return
    const { data, error, status } = await supabase.from<User>('users').insert({ id: address }).single();

    if (data) {
      req.session.user = data;
      await req.session.save();

      res.setHeader(headerName, headerValue).status(200).json({ user: data });
    } else if (error) {
      res.setHeader(headerName, headerValue).status(status).json({ message: error.message });
    }
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
