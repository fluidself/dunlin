import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { createEditor, Editor, Element, Node } from 'slate';
import { IconSend, IconConfetti } from '@tabler/icons';
import * as Name from 'w3name'; // eslint-disable-line
import { toast } from 'react-toastify';
import { ElementType, NoteLink } from 'types/slate';
import { DecryptedNote } from 'types/decrypted';
import useHotkeys from 'utils/useHotkeys';
import copyToClipboard from 'utils/copyToClipboard';
import useIpfs from 'utils/useIpfs';
import { store } from 'lib/store';
import { getSerializedNote } from 'components/editor/NoteHeader';
import Button from 'components/home/Button';
import Toggle from 'components/Toggle';

type Props = {
  note: DecryptedNote;
  userId: string | undefined;
  setIsOpen: (isOpen: boolean) => void;
};

type NotePublication = {
  address: string;
  timestamp: number;
  title: string;
  body: string;
};

const UUID_REGEX = /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/gm;
const NOTE_LINK_REGEX = /\[(.+)\]\(([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})\)/gm;

export default function PublishNoteModal(props: Props) {
  const { note, userId, setIsOpen } = props;

  const { client } = useIpfs();
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
  }, [note.content]);

  const getNotesToPublish = (note: DecryptedNote, mapOfNotes: Map<string, { id: string; title: string; body: string }>) => {
    const SERIALIZE_OPTS = { forPublication: true, publishLinkedNotes };
    const serializedBody = getSerializedNote(note, SERIALIZE_OPTS);
    const linkedNotes = serializedBody.match(UUID_REGEX);
    const notes = store.getState().notes;

    mapOfNotes.set(note.id, { id: note.id, title: notes[note.id].title, body: serializedBody });

    linkedNotes?.forEach(noteId => {
      const body = getSerializedNote(notes[noteId], SERIALIZE_OPTS);
      const bodyLinkedNotes = body.match(UUID_REGEX);

      if (bodyLinkedNotes) {
        mapOfNotes = getNotesToPublish(notes[noteId], mapOfNotes);
      } else {
        mapOfNotes.set(noteId, { id: noteId, title: notes[noteId].title, body });
      }
    });

    return mapOfNotes;
  };

  // TODO: make reusable and move to useIpfs?
  const prepareFileObject = (note: NotePublication, fileName: string) => {
    const blob = new Blob([JSON.stringify(note)], { type: 'application/json' });
    const file = new File([blob], `${fileName}.json`);

    return file;
  };

  const publishNote = async (note: NotePublication) => {
    const file = prepareFileObject(note, `${note.address}-${note.timestamp}`);
    const cid = await client.put([file], { wrapWithDirectory: false });

    return cid;
  };

  const publishNoteRevision = async (cid: string) => {
    const name = await Name.create();
    // TODO: could value just be cid ?
    const value = `/ipfs/${cid}`;
    const revision = await Name.v0(name, value);

    await Name.publish(revision, name.key);

    return { name, revision };
  };

  const updateNoteRevision = async (cid: string, name: any, revision: any) => {
    // TODO: could value just be cid ?
    const nextValue = `/ipfs/${cid}`;
    const nextRevision = await Name.increment(revision, nextValue);

    await Name.publish(nextRevision, name.key);

    return nextRevision;
  };

  const onConfirm = async () => {
    if (!userId) return;
    setProcessing(true);

    const notesToPublish = getNotesToPublish(note, new Map<string, { id: string; title: string; body: string }>());
    const interimNotes: { publication: NotePublication; name: any; revision: any }[] = [];
    // const publishedNotes: { id: string; cid: string }[] = [];
    const publishedNotes: { id: string; cidOrName: string }[] = [];

    // console.log(noteLinks);
    console.log(notesToPublish);

    try {
      for (const noteToPublish of notesToPublish.values()) {
        const hasNoteLinks = noteToPublish.body.match(NOTE_LINK_REGEX) !== null;
        console.log(`${noteToPublish.id} hasNoteLinks: ${hasNoteLinks}`);
        const publication = { address: userId, timestamp: Date.now(), title: noteToPublish.title, body: noteToPublish.body };
        const cid = await publishNote(publication);

        if (hasNoteLinks) {
          const { name, revision } = await publishNoteRevision(cid);
          // interimNotes.push({ id: noteToPublish.id, title: noteToPublish.title, body: noteToPublish.body, name, revision });
          interimNotes.push({ publication, name, revision });
          publishedNotes.push({ id: noteToPublish.id, cidOrName: name.toString() });
        } else {
          publishedNotes.push({ id: noteToPublish.id, cidOrName: cid });
        }
      }

      console.log(interimNotes);
      console.log(publishedNotes);

      for (const interimNote of interimNotes) {
        let updatedBody = interimNote.publication.body;

        for (const noteId of notesToPublish.keys()) {
          // const cid =
          //   interimNotes.find(interimNote => interimNote.id === noteId)?.name.toString() ||
          //   publishedNotes.find(publishedNote => publishedNote.id === noteId)?.cidOrName;

          // should always exist?
          // const cidOrName = publishedNotes.find(publishedNote => publishedNote.id === noteId)?.cidOrName;
          // if (cidOrName) {
          //   // more accurate w/ notelink regex?
          //   updatedBody = updatedBody.replaceAll(noteId, `/publications/${cidOrName}`);
          // }

          if (updatedBody.includes(noteId)) {
            // should always exist?
            const cidOrName = publishedNotes.find(publishedNote => publishedNote.id === noteId)?.cidOrName;
            // more accurate w/ notelink regex?
            updatedBody = cidOrName ? updatedBody.replaceAll(noteId, `/publications/${cidOrName}`) : updatedBody;
          }
        }

        const { name, revision, publication } = interimNote;
        // const updatedNote = { ...rest, body: updatedBody };
        // const cid = await publishNote({ address: userId, timestamp: Date.now(), ...updatedNote });
        const updatedPublication = { ...publication, body: updatedBody };
        const cid = await publishNote(updatedPublication);
        await updateNoteRevision(cid, name, revision);

        // const finalResolvedValue = (await Name.resolve(name)).value;
        // const finalCid = finalResolvedValue.replace('/ipfs/', '');

        // publishedNotes.push({ id: interimNote.id, cid: finalCid });
      }

      console.log(publishedNotes);
      // should always exist?
      const publicationHash = publishedNotes.find(publishedNote => publishedNote.id === note.id)?.cidOrName!;

      toast.success('Published!');
      setPublicationHash(publicationHash);
      setProcessing(false);
      setPublished(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish.');
      setProcessing(false);
    }

    // setProcessing(false);
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
