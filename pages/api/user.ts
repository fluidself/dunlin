import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import { ironOptions } from 'constants/iron-session';
import supabaseClient from 'lib/supabase';
import type { User } from 'types/supabase';

const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY as string;
const JWT_SECRET = process.env.JWT_SECRET as string;

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

  const supabase = supabaseClient;
  supabase.auth.setAuth(SERVICE_ROLE_KEY);

  let { data: user } = await supabase.from<User>('users').select('*').match({ id: address }).single();

  if (!user) {
    const { data } = await supabase.from<User>('users').insert({ id: address }).single();
    user = data;
  }

  if (!user) {
    res.setHeader(headerName, headerValue).status(500).json({ message: 'Could not find or create user' });
    return;
  }

  const token = sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  const daemonUsers = process.env.DAEMON_USERS?.split(',').map(id => id.toLowerCase()) ?? [];
  const isDaemonUser = daemonUsers.includes(user.id.toLowerCase());

  req.session.user = user;
  req.session.dbToken = token;
  await req.session.save();

  res.setHeader(headerName, headerValue).status(200).json({ user, token, isDaemonUser });
};

export default withIronSessionApiRoute(handler, ironOptions);
