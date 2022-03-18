import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { ironOptions } from 'constants/iron-session';
import { Deck } from 'types/supabase';
import supabase from 'lib/supabase';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      const { deckId } = req.body;
      const { data: deck, error } = await supabase.from<Deck>('decks').select('*').match({ id: deckId }).single();

      if (deck) {
        res.status(200).json({ deck });
      } else if (error) {
        res.status(500).json({ message: error.message });
      }

      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} not allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
