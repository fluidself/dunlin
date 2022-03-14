import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';
import { User } from 'types/supabase';
import supabase from 'lib/supabase';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      // const walletAddress = req.session.siwe?.address;
      const { address } = req.body;

      const user = await supabase.from<User>('users').select('*').match({ id: address }).single();

      if (user.data) {
        // DB user exists, return it
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
          res.status(200).json({ user: result.data });
        } else if (result.error) {
          res.status(result.status).json({ message: result.error.message });
        }
      }

      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} not allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
