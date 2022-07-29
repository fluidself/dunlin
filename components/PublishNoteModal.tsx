import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { createEditor, Editor, Element, Node } from 'slate';
import { IconSend, IconConfetti } from '@tabler/icons';
import fleekStorage from '@fleekhq/fleek-storage-js';
import { toast } from 'react-toastify';
import { ElementType, NoteLink } from 'types/slate';
import { DecryptedNote } from 'types/decrypted';
import useHotkeys from 'utils/useHotkeys';
import copyToClipboard from 'utils/copyToClipboard';
import { store } from 'lib/store';
import { getSerializedNote } from 'components/editor/NoteHeader';
import Button from 'components/home/Button';
import Toggle from 'components/Toggle';

type Props = {
  note: DecryptedNote;
  userId: string | undefined;
  setIsOpen: (isOpen: boolean) => void;
};

const UUID_REGEX = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/gm;
const NOTE_LINK_REGEX = /\[(.+)\]\(([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})\)/gm;

export default function PublishNoteModal(props: Props) {
  const { note, userId, setIsOpen } = props;
  const [noteLinks, setNoteLinks] = useState<NoteLink[]>([]);
  const [publishLinkedNotes, setPublishLinkedNotes] = useState(false);
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

  useEffect(() => {
    const editor = createEditor();
    editor.children = note.content;
    const matchingElements = Array.from(
      Editor.nodes<NoteLink>(editor, {
        at: [],
        match: n => Element.isElement(n) && n.type === ElementType.NoteLink && !!Node.string(n),
      }),
    ).map(element => element[0]);

    setNoteLinks(matchingElements);
  }, []);

  const getNotesToPublish = (note: DecryptedNote, mapOfNotes: Map<string, string>) => {
    const SERIALIZE_OPTS = { forPublication: true, publishLinkedNotes };
    const serializedBody = getSerializedNote(note, SERIALIZE_OPTS);
    const linkedNotes = serializedBody.match(UUID_REGEX);
    const notes = store.getState().notes;

    mapOfNotes.set(note.id, serializedBody);

    linkedNotes?.forEach(noteId => {
      const body = getSerializedNote(notes[noteId], SERIALIZE_OPTS);
      const bodyLinkedNotes = body.match(UUID_REGEX);

      if (bodyLinkedNotes) {
        mapOfNotes = getNotesToPublish(notes[noteId], mapOfNotes);
      } else {
        mapOfNotes.set(noteId, body);
      }
    });

    return mapOfNotes;
  };

  const onConfirm = async () => {
    if (!userId) return;
    setProcessing(true);

    const noteMap = new Map<string, string>();
    const notesToPublish = getNotesToPublish(note, noteMap);
    // map of noteId => serializedBody
    // serializedBody has noteIds that need to be replaced with links
    // [link text](uuid) => `${process.env.BASE_URL}/publications/${publicationHash}`
    console.log(noteLinks);
    console.log(notesToPublish);

    setProcessing(false);

    // const data = JSON.stringify({ address: userId, timestamp: Date.now(), title: note.title, body: serializedBody });

    // try {
    //   const uploadedFile = await fleekStorage.upload({
    //     apiKey: process.env.NEXT_PUBLIC_FLEEK_API_KEY ?? '',
    //     apiSecret: process.env.NEXT_PUBLIC_FLEEK_API_SECRET ?? '',
    //     key: `${userId}/${note.title}`,
    //     data,
    //   });

    //   toast.success('Published!');
    //   setPublicationHash(uploadedFile.hash);
    //   setProcessing(false);
    //   setPublished(true);
    // } catch (error) {
    //   console.error(error);
    //   toast.error('Failed to publish.');
    //   setProcessing(false);
    // }
  };

  const singleNoteLink = noteLinks.length === 1;

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
                <p>
                  You are about to publish this note to the public. Please double check that you are only including what you
                  intended.
                </p>
                {noteLinks.length > 0 && (
                  <>
                    <p className="my-4">
                      {`The note contains ${singleNoteLink ? 'a link' : 'links'} to ${
                        singleNoteLink ? 'another note' : 'other notes'
                      }. Do you want to publish the note${!singleNoteLink ? 's' : ''} that ${
                        singleNoteLink ? 'is' : 'are'
                      } linked to? If ${singleNoteLink ? 'that note' : 'those notes'} in turn link${
                        singleNoteLink ? 's' : ''
                      } to other notes, those would also be published.`}
                    </p>
                    <div className="flex items-center">
                      <span className="text-sm">No</span>
                      <Toggle className="mx-2" id="1" isChecked={publishLinkedNotes} setIsChecked={setPublishLinkedNotes} />
                      <span className="text-sm">Yes, publish linked notes</span>
                    </div>
                  </>
                )}
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
