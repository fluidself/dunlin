import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';
import { User } from 'types/supabase';
import supabase from 'lib/supabase';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  const userInSession = req.session.user;
  if (userInSession) {
    res.status(200).json({ user: userInSession });
    return;
  }

  const address = req.session.siwe?.address;
  if (!address) {
    res.status(200).json({ user: null });
    return;
  }

  const user = await supabase.from<User>('users').select('*').match({ id: address }).single();

  if (user.data) {
    // DB user exists, return it
    req.session.user = user.data;
    await req.session.save();

    res.status(200).json({ user: user.data });

    return;
  } else {
    // DB user does not exist, create and return
    const result = await supabase
      .from<User>('users')
      .insert({
        id: address,
      })
      .single();

    if (result.data) {
      req.session.user = result.data;
      await req.session.save();

      res.status(200).json({ user: result.data });
    } else if (result.error) {
      res.status(result.status).json({ message: result.error.message });
    }
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
