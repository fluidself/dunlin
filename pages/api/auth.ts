import { NextApiRequest, NextApiResponse } from 'next';
import { utils } from 'ethers';
import { User as DbUser } from 'types/supabase';
import supabase from 'lib/supabase';

function isAddress(address: string) {
  try {
    utils.getAddress(address);
  } catch (e) {
    console.log(e);
    return false;
  }

  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { walletAddress } = JSON.parse(req.body);

  if (!isAddress(walletAddress)) {
    res.status(400).json({ message: 'Please provide a valid address.' });
    return;
  }

  const user = await supabase.from<DbUser>('users').select('*').match({ id: walletAddress }).single();

  if (user.data) {
    res.status(200).json({ ...user.data });

    return;
  } else {
    const result = await supabase
      .from<DbUser>('users')
      .insert({
        id: walletAddress,
      })
      .single();

    if (result.data) {
      res.status(200).json({ ...result.data });
    } else if (result.error) {
      res.status(result.status).json({ message: result.error.message });
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
