import * as Client from '@web3-storage/w3up-client';
import * as Signer from '@ucanto/principal/ed25519';
import { importDAG } from '@ucanto/core/delegation';
import { CarReader } from '@ipld/car';

export async function createClient() {
  const principal = Signer.parse(process.env.NEXT_PUBLIC_W3UP_KEY as string);
  const proof = await parseProof(process.env.NEXT_PUBLIC_W3UP_PROOF as string);
  const client = await Client.create({ principal });
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  return client;
}

async function parseProof(data: string) {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  // @ts-ignore
  return importDAG(blocks);
}
