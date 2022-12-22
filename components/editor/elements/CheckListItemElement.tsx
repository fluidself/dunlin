import { ChangeEvent, ReactNode, useCallback } from 'react';
import { createEditor, Transforms } from 'slate';
import { ReactEditor, RenderElementProps, useReadOnly, useSlateStatic } from 'slate-react';
import { CheckListItem } from 'types/slate';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { encrypt } from 'utils/encryption';
import updateNote from 'lib/api/updateNote';
import { store } from 'lib/store';

type Props = {
  element: CheckListItem;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CheckListItemElement(props: Props) {
  const { attributes, children, element, className } = props;
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const { checked } = element;

  const onInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;

      try {
        const path = ReactEditor.findPath(editor, element);
        const newProperties: Partial<CheckListItem> = { checked: event.target.checked };
        Transforms.setNodes(editor, newProperties, { at: path });

        // Update note locally and in database
        const noteEditor = createEditor();
        noteEditor.children = store.getState().notes[noteId].content;
        Transforms.setNodes(noteEditor, newProperties, { at: path });

        store.getState().updateNote({ id: noteId, content: noteEditor.children });

        const encryptedContent = encrypt(noteEditor.children, key);
        await updateNote({ id: noteId, content: encryptedContent });
      } catch (e) {
        const message = e instanceof Error ? e.message : e;
        console.error(`There was an error updating the checklist item: ${message}`);
      }
    },
    [editor, element, readOnly, key, noteId],
  );

  return (
    <div className={`flex items-center ${className}`} {...attributes}>
      <div className="flex items-center justify-center mr-2 select-none" contentEditable={false}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onInputChange}
          className="bg-transparent border-2 hover:cursor-pointer text-primary-500 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 focus:ring-0 hover:text-primary-600 active:text-primary-700"
        />
      </div>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={`flex-1 ${checked ? 'opacity-60 line-through' : 'opacity-100'}`}
      >
        {children}
      </span>
    </div>
  );
}
