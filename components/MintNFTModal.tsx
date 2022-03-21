import { useMemo, useCallback, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons';
import fleekStorage from '@fleekhq/fleek-storage-js';
// import { useSigner, useContract } from 'wagmi';
// import { Contract } from 'ethers';
import { toast } from 'react-toastify';
import { Note } from 'types/supabase';
import useHotkeys from 'utils/useHotkeys';
import { getSerializedNote } from 'components/editor/NoteHeader';
import Button from 'components/home/Button';

type Props = {
  note: Note;
  userId: string | undefined;
  setIsOpen: (isOpen: boolean) => void;
};

export default function MintNFTModal(props: Props) {
  const { note, userId, setIsOpen } = props;

  // const [{ data: signer }] = useSigner();
  // const contract: Contract = useContract({
  //   addressOrName: CONTRACT_ADDRESS,
  //   contractInterface: DECKNFT.abi,
  //   signerOrProvider: signer,
  // });
  const [processing, setProcessing] = useState<boolean>(false);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => setIsOpen(false),
      },
    ],
    [setIsOpen],
  );
  useHotkeys(hotkeys);

  const onConfirm = useCallback(async () => {
    if (!userId) return;
    setProcessing(true);

    const serializedBody = getSerializedNote(note);
    const data = JSON.stringify({ title: note.title, body: serializedBody });

    try {
      const uploadedFile = await fleekStorage.upload({
        apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY ?? '',
        apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET ?? '',
        key: `${userId}/${note.title}`,
        data,
      });
      // console.log(uploadedFile);

      // const tokenURI = `https://ipfs.infura.io/ipfs/${uploadedFile.hash}`;
      // const tx = await contract.createToken(tokenURI);
      // // const rec = await tx.wait();

      // toast.info('Processing transaction');

      // await tx.wait();

      toast.success('Your NFT was minted!');
      setProcessing(false);
      // // redirect somewhere or setIsOpen(false)?
      // router.push(`/publication/${uploadedFile.hash}`);
    } catch (e: any) {
      toast.error('Failed to mint the NFT.');
      console.error(e);
    }
  }, [note]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-800 text-gray-200">
          <div className="flex items-center flex-shrink-0 w-full">
            <IconAlertTriangle className="ml-4 mr-1 text-gray-200" size={32} />
            <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0 bg-gray-800">
              Confirm NFT minting
            </span>
          </div>
          <div className="px-4 py-2 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-700 border-gray-700">
            You are about to mint this note's content as an NFT. Double check that you are publishing exactly what you intend to.
            <Button
              className={`my-4 ${processing ? 'bg-gray-600 text-gray-300 hover:bg-gray-600 hover:bg-text-gray-300' : ''}`}
              primary
              onClick={onConfirm}
              disabled={processing}
              loading={processing}
            >
              Mint my NFT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
