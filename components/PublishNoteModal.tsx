import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { createEditor, Descendant, Editor, Element, Node } from 'slate';
import { IconSend, IconConfetti, IconX } from '@tabler/icons';
import * as Name from 'w3name';
import { toast } from 'react-toastify';
import { Callout, ElementType, Footnote, NoteLink } from 'types/slate';
import type { DecryptedNote } from 'types/decrypted';
import useHotkeys from 'utils/useHotkeys';
import copyToClipboard from 'utils/copyToClipboard';
import useIpfs from 'utils/useIpfs';
import { store } from 'lib/store';
import { getSerializedNote } from 'components/editor/NoteHeader';
import Button from 'components/Button';

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
const NOTE_LINK_REGEX =
  /\[(.+)\]\(([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})\)/gm;

export default function PublishNoteModal(props: Props) {
  const { note, userId, setIsOpen } = props;

  const client = useIpfs();
  const [noteLinks, setNoteLinks] = useState<NoteLink[]>([]);
  const [hasFileAttachments, setHasFileAttachments] = useState(false);
  const [publishLinkedNotes, setPublishLinkedNotes] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publicationCid, setPublicationCid] = useState('');

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
    const hasFileAttachments = note.content.some(n => Element.isElement(n) && n.type === ElementType.FileAttachment);
    const noteLinks = computeNoteLinks(note.content);

    setHasFileAttachments(hasFileAttachments);
    setNoteLinks(noteLinks);
  }, [note.content]);

  const getNotesToPublish = (
    note: DecryptedNote,
    mapOfNotes: Map<string, { id: string; title: string; body: string }>,
  ) => {
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

  const prepareFileObject = (note: NotePublication, fileName: string) => {
    const blob = new Blob([JSON.stringify(note)], { type: 'application/json' });
    const file = new File([blob], `${fileName}.json`);

    return file;
  };

  const publishNote = async (note: NotePublication) => {
    const file = prepareFileObject(note, `${note.address}-${note.timestamp}`);
    const link = await client!.uploadFile(file);
    const cid = link.toString() as string;

    return cid;
  };

  const publishNoteRevision = async (cid: string) => {
    const name = await Name.create();
    const value = `/ipfs/${cid}`;
    const revision = await Name.v0(name, value);

    await Name.publish(revision, name.key);

    return { name, revision };
  };

  const updateNoteRevision = async (cid: string, name: Name.WritableName, revision: Name.Revision) => {
    const nextValue = `/ipfs/${cid}`;
    const nextRevision = await Name.increment(revision, nextValue);

    await Name.publish(nextRevision, name.key);

    return nextRevision;
  };

  const onConfirm = async () => {
    if (!userId || !client) return;
    setProcessing(true);

    const publishingToast = toast.info('Publishing to IPFS, please wait...', {
      autoClose: false,
      closeButton: false,
      draggable: false,
    });

    const notesToPublish = getNotesToPublish(note, new Map<string, { id: string; title: string; body: string }>());
    const interimNotes: { publication: NotePublication; name: Name.WritableName; revision: Name.Revision }[] = [];
    const publishedNotes: { id: string; cid: string }[] = [];

    try {
      for (const noteToPublish of notesToPublish.values()) {
        const hasNoteLinks = noteToPublish.body.match(NOTE_LINK_REGEX) !== null;
        const publication = {
          address: userId,
          timestamp: Date.now(),
          title: noteToPublish.title,
          body: noteToPublish.body,
        };
        const cid = await publishNote(publication);

        if (hasNoteLinks) {
          const { name, revision } = await publishNoteRevision(cid);
          interimNotes.push({ publication, name, revision });
          publishedNotes.push({ id: noteToPublish.id, cid: name.toString() });
        } else {
          publishedNotes.push({ id: noteToPublish.id, cid: cid });
        }
      }

      for (const interimNote of interimNotes) {
        let updatedBody = interimNote.publication.body;

        for (const noteId of notesToPublish.keys()) {
          if (updatedBody.includes(noteId)) {
            const cidOrName = publishedNotes.find(publishedNote => publishedNote.id === noteId)?.cid;
            updatedBody = cidOrName ? updatedBody.replaceAll(noteId, `/publications/${cidOrName}`) : updatedBody;
          }
        }

        const { name, revision, publication } = interimNote;
        const updatedPublication = { ...publication, body: updatedBody };
        const cid = await publishNote(updatedPublication);

        await updateNoteRevision(cid, name, revision);
      }
    } catch (error) {
      console.error(error);
    }

    const publishedCid = publishedNotes.find(publishedNote => publishedNote.id === note.id)?.cid;

    setProcessing(false);
    toast.dismiss(publishingToast);

    if (publishedCid) {
      setPublicationCid(publishedCid);
      setPublished(true);
      toast.success('Published!');
    } else {
      toast.error('Failed to publish.');
    }
  };

  const singleNoteLink = noteLinks.length === 1;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsOpen(false)} />
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col z-30 w-full max-w-screen-sm rounded shadow-popover bg-white dark:bg-gray-900 dark:text-gray-200 border dark:border-gray-600">
          <div className="flex items-center justify-between flex-shrink-0 py-2 w-full bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center">
              {published ? (
                <IconConfetti className="ml-4 mr-1 text-gray-600 dark:text-gray-200" size={24} />
              ) : (
                <IconSend className="ml-4 mr-1 text-gray-600 dark:text-gray-200" size={24} />
              )}
              <span className="text-lg font-heading tracking-wide px-2 border-none focus:ring-0">
                {published ? 'Note published' : 'Publish note'}
              </span>
            </div>
            <button
              className="mb-6 mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <IconX size={20} />
            </button>
          </div>
          <div className="px-4 py-4 flex-1 w-full overflow-y-auto border-t rounded-bl rounded-br dark:bg-gray-800 dark:border-gray-700">
            <div className="flex mb-2 m-[-4px] flex-wrap">
              <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded">
                {note.title}
              </span>
              <span className="text-xs m-1 inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded">
                {note.id}
              </span>
            </div>
            {published ? (
              <>
                <p>Your note has been published and can be viewed here:</p>
                <p>
                  <Link
                    href={`/publications/${publicationCid}`}
                    className="text-sm break-words hover:underline link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`${process.env.BASE_URL}/publications/${publicationCid}`}
                  </Link>
                </p>
                <div className="flex space-x-8 my-4">
                  <Button
                    primary
                    onClick={async () =>
                      await copyToClipboard(`${process.env.BASE_URL}/publications/${publicationCid}`)
                    }
                  >
                    Copy Link
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </div>
              </>
            ) : (
              <>
                <p>
                  {`You are about to publish "${note.title}" to the public. Please double check that you are only including what
                  you intend to.`}
                </p>
                {hasFileAttachments && (
                  <p className="mt-4">File attachments will not be included in the publication.</p>
                )}
                {noteLinks.length > 0 && (
                  <p className="mt-4">
                    {`The note contains ${singleNoteLink ? 'a link' : 'links'} to ${
                      singleNoteLink ? 'another note' : 'other notes'
                    }. Do you want to publish the note${!singleNoteLink ? 's' : ''} that ${
                      singleNoteLink ? 'is' : 'are'
                    } linked to? If ${singleNoteLink ? 'that note' : 'those notes'} in turn link${
                      singleNoteLink ? 's' : ''
                    } to other notes, those would also be published.`}
                  </p>
                )}
                <div className={`flex mt-4 ${noteLinks.length > 0 ? 'justify-between' : 'justify-end'}`}>
                  {noteLinks.length > 0 && (
                    <div
                      className="flex items-center justify-center select-none"
                      onClick={() => setPublishLinkedNotes(!publishLinkedNotes)}
                    >
                      <input
                        type="checkbox"
                        checked={publishLinkedNotes}
                        onChange={() => setPublishLinkedNotes(!publishLinkedNotes)}
                        className="bg-transparent border-2 hover:cursor-pointer p-2 mr-2 rounded-sm text-primary-500 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 focus:ring-0 hover:text-primary-600 active:text-primary-700"
                      />
                      <span>Yes, publish linked notes</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-4">
                    <Button primary onClick={onConfirm} disabled={processing} loading={processing}>
                      Publish
                    </Button>
                    <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const computeNoteLinks = (content: Descendant[]) => {
  const contentEditor = createEditor();
  contentEditor.children = content;
  const footnoteAndCalloutContent = Array.from(
    Editor.nodes<Footnote | Callout>(contentEditor, {
      at: [],
      match: n => Element.isElement(n) && (n.type === ElementType.Footnote || n.type === ElementType.Callout),
    }),
  )
    .map(nodeEntry => nodeEntry[0])
    .map(node => (node.type === ElementType.Callout ? node.content : node.definition))
    .flat();
  const combinedContent = [...content, ...footnoteAndCalloutContent];
  const combinedContentEditor = createEditor();
  combinedContentEditor.children = combinedContent;
  const noteLinks = Array.from(
    Editor.nodes<NoteLink>(combinedContentEditor, {
      at: [],
      match: n => Element.isElement(n) && n.type === ElementType.NoteLink && !!Node.string(n),
    }),
  ).map(element => element[0]);

  return noteLinks;
};
