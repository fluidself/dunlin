import fleekStorage from '@fleekhq/fleek-storage-js';
import { IpfsHashes } from 'types/supabase';

export const useIpfsUpload = async (userId: string, fileObjects: any[]) => {
  const ipfsHashes: IpfsHashes = {};

  for (const fileObj of fileObjects) {
    try {
      const uploadedFile = await fleekStorage.upload({
        apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY ?? '',
        apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET ?? '',
        key: `${userId}/${fileObj.key}`,
        data: JSON.stringify({ [fileObj.key]: fileObj.file }),
      });

      // @ts-ignore
      ipfsHashes[fileObj.key] = uploadedFile.hash;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  return ipfsHashes;
};
