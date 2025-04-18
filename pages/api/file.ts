import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import formidable from 'formidable';
import { PinataSDK } from 'pinata';
import { v4 as uuidv4 } from 'uuid';
import { ironOptions } from 'constants/iron-session';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ParsedFormData = {
  fields: formidable.Fields;
  files: formidable.Files;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} not allowed`);
  }

  try {
    const data = await new Promise<ParsedFormData>((resolve, reject) => {
      const form = formidable();
      form.parse(req, (err, fields, files) => {
        if (err) reject({ err });
        resolve({ fields, files });
      });
    });
    const dataFiles = data.files.file;

    if (!dataFiles || dataFiles.length !== 1) {
      return res.status(400).json({ error: 'A single file upload named "file" is required' });
    }

    const dataFile = dataFiles[0];
    const buffer = fs.readFileSync(dataFile.filepath);
    const arraybuffer = Uint8Array.from(buffer);
    const file = new File([arraybuffer], dataFile.originalFilename || uuidv4(), {
      type: dataFile.mimetype || 'application/octet-stream',
    });

    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    });
    const { cid } = await pinata.upload.public.file(file);

    return res.status(200).json({ cid });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
