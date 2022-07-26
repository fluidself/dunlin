import Link from 'next/link';
import { useMemo, useState } from 'react';
import { IconSend, IconConfetti } from '@tabler/icons';
import fleekStorage from '@fleekhq/fleek-storage-js';
import { toast } from 'react-toastify';
import { DecryptedNote } from 'types/decrypted';
import useHotkeys from 'utils/useHotkeys';
import copyToClipboard from 'utils/copyToClipboard';
import { getSerializedNote } from 'components/editor/NoteHeader';
import Button from 'components/home/Button';

type Props = {
  note: DecryptedNote;
  userId: string | undefined;
  setIsOpen: (isOpen: boolean) => void;
};

export default function PublishNoteModal(props: Props) {
  const { note, userId, setIsOpen } = props;
  const [processing, setProcessing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publicationHash, setPublicationHash] = useState('');

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

  const onConfirm = async () => {
    if (!userId) return;
    setProcessing(true);

    const serializedBody = getSerializedNote(note);
    const data = JSON.stringify({ address: userId, timestamp: Date.now(), title: note.title, body: serializedBody });

    try {
      const uploadedFile = await fleekStorage.upload({
        apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY ?? '',
        apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET ?? '',
        key: `${userId}/${note.title}`,
        data,
      });

      toast.success('Published!');
      setPublicationHash(uploadedFile.hash);
      setProcessing(false);
      setPublished(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-gray-800 text-gray-200">
          <div className="flex items-center flex-shrink-0 w-full">
            {published ? (
              <IconConfetti className="ml-4 mr-1 text-gray-200" size={32} />
            ) : (
              <IconSend className="ml-4 mr-1 text-gray-200" size={32} />
            )}
            <span className="text-xl py-4 px-2 border-none rounded-tl rounded-tr focus:ring-0 bg-gray-800">
              {published ? 'Note published' : 'Confirm publishing'}
            </span>
          </div>
          <div className="px-4 py-2 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br bg-gray-700 border-gray-700">
            <div className="flex mb-2 m-[-4px] flex-wrap">
              <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
                {note.title}
              </span>
              <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
                {note.id}
              </span>
            </div>
            {published ? (
              <>
                <p>Your note has been published and can be viewed here:</p>
                <p>
                  <Link href={`/publications/${publicationHash}`}>
                    <a
                      className="text-sm break-words hover:underline text-primary-400"
                      href={`/publications/${publicationHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {`${process.env.BASE_URL}/publications/${publicationHash}`}
                    </a>
                  </Link>
                </p>
                <div className="flex space-x-8 my-4">
                  <Button
                    primary
                    onClick={async () => await copyToClipboard(`${process.env.BASE_URL}/publications/${publicationHash}`)}
                  >
                    Copy Link
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </div>
              </>
            ) : (
              <>
                You are about to publish this note to the public. Please double check that you are only including what you
                intended.
                <Button
                  className={`my-4 ${processing ? 'bg-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-400' : ''}`}
                  primary
                  onClick={onConfirm}
                  disabled={processing}
                  loading={processing}
                >
                  Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
