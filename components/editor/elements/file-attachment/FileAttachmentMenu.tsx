import { useCallback, useMemo, useState } from 'react';
import { Transforms, createEditor } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { IconTrash, IconX } from '@tabler/icons';
import { ElementType, FileAttachment } from 'types/slate';
import { store } from 'lib/store';
import updateNote from 'lib/api/updateNote';
import useHotkeys from 'utils/useHotkeys';
import useDebounce from 'utils/useDebounce';
import { encrypt } from 'utils/encryption';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import useOnClickOutside from 'utils/useOnClickOutside';
import Button from 'components/Button';

type FileAttachmentMenuProps = {
  element: FileAttachment;
  onClose: () => void;
};

export default function FileAttachmentMenu({ element, onClose }: FileAttachmentMenuProps) {
  const editor = useSlateStatic();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const [description, setDescription] = useState(element.description ?? '');
  const [filename, setFilename] = useState(getFilename(element.file.filename));
  const [isFilenameValid] = useDebounce(Boolean(filename), 500);
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null);
  useOnClickOutside(menuElement, onClose);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'esc',
        callback: () => onClose(),
      },
    ],
    [onClose],
  );
  useHotkeys(hotkeys);

  const handleSave = useCallback(async () => {
    if (filename === getFilename(element.file.filename) && description === element.description) {
      onClose();
      return;
    }

    try {
      const path = ReactEditor.findPath(editor, element);
      const newProperties: Partial<FileAttachment> = {
        file: { ...element.file, filename: `${filename}.${getFileExtension(element.file.filename)}` },
        description: description,
      };
      Transforms.setNodes<FileAttachment>(editor, newProperties, { at: path });

      // Update note locally and in database
      const noteEditor = createEditor();
      noteEditor.children = store.getState().notes[noteId].content;
      Transforms.setNodes(noteEditor, newProperties, { at: path });

      store.getState().updateNote({ id: noteId, content: noteEditor.children });

      const encryptedContent = encrypt(noteEditor.children, key);
      await updateNote({ id: noteId, content: encryptedContent });
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : e;
      console.error(`There was an error updating the file attachment: ${message}`);
    }
  }, [element, editor, description, filename, key, noteId, onClose]);

  const handleRemove = useCallback(() => {
    Transforms.removeNodes(editor, { match: n => n.type === ElementType.FileAttachment });
  }, [editor]);

  return (
    <div
      className="flex flex-col z-10 w-96 absolute top-0 right-0 rounded bg-gray-800 border border-gray-700"
      ref={setMenuElement}
    >
      <div className="flex items-center justify-between">
        <div className="py-3 pl-4">Attachment settings</div>
        <button className="mb-4 mr-1 text-gray-300 hover:text-gray-100" onClick={onClose}>
          <IconX size={18} />
        </button>
      </div>
      <div className="flex flex-col px-4 py-3 space-y-2 border-y border-gray-700">
        <label htmlFor="filename">Filename</label>
        <input
          type="text"
          id="filename"
          placeholder="Enter filename"
          autoComplete="off"
          className={`input bg-gray-700 text-gray-200 ${
            isFilenameValid ? 'border-gray-700' : 'border-red-500 active:border-red-500 focus:border-red-500'
          }`}
          onCopy={e => e.stopPropagation()}
          onPaste={e => e.stopPropagation()}
          value={filename}
          onChange={e => setFilename(e.target.value)}
        />
        <label htmlFor="description">Description</label>
        <input
          type="text"
          id="description"
          placeholder="Enter description"
          autoComplete="off"
          className="input bg-gray-700 text-gray-200 border-gray-700"
          onCopy={e => e.stopPropagation()}
          onPaste={e => e.stopPropagation()}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="pt-2">
          <Button primary className="w-full" disabled={!isFilenameValid} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
      <button
        className="flex flex-row items-center justify-center py-3 focus:outline-none hover:bg-gray-700 active:bg-gray-600"
        autoFocus
        onClick={handleRemove}
      >
        <IconTrash size={18} className="flex-shrink-0 mr-1" />
        <span>Remove attachment</span>
      </button>
    </div>
  );
}

function getFileExtension(filename: string) {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

function getFilename(filename: string) {
  const extension = getFileExtension(filename);
  return filename.substring(0, filename.length - extension.length - 1);
}
