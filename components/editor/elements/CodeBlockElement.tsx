import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Editor, createEditor, Node, Transforms, Path } from 'slate';
import { ReactEditor, RenderElementProps, useSlateStatic, useReadOnly } from 'slate-react';
import Select from 'react-select';
import { CODE_BLOCK_LANGUAGES } from 'editor/decorateCodeBlocks';
import { CodeBlock, ElementType, MermaidDiagram } from 'types/slate';
import { useCurrentNote } from 'utils/useCurrentNote';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import useOnClickOutside from 'utils/useOnClickOutside';
import { encrypt } from 'utils/encryption';
import updateNote from 'lib/api/updateNote';
import { store, useStore } from 'lib/store';

const selectOptions = [
  { value: '', label: 'Plaintext' },
  ...Object.entries(CODE_BLOCK_LANGUAGES).map(([key, val]) => ({
    value: key,
    label: val,
  })),
];

type Props = {
  element: CodeBlock;
  children: ReactNode;
  attributes: RenderElementProps['attributes'];
  className?: string;
};

export default function CodeBlockElement(props: Props) {
  const { attributes, children, element, className } = props;
  const { lang } = element;
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const { id: noteId } = useCurrentNote();
  const { key } = useCurrentDeck();
  const darkMode = useStore(state => state.darkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null);
  useOnClickOutside(menuElement, () => setIsOpen(false));
  const path = useMemo(() => ReactEditor.findPath(editor, element), [editor, element]);
  const isMermaidCodeBlockFocused = useMemo(
    () => lang === 'mermaid' && editor.selection && Path.isDescendant(editor.selection.anchor.path, path),
    [lang, path, editor.selection],
  );

  const onSelectChange = useCallback(
    async (newLang: string) => {
      if (readOnly) return;

      try {
        const newProperties: Partial<CodeBlock> = { lang: newLang };
        Transforms.setNodes(editor, newProperties, { at: path });

        // Update note locally and in database
        const noteEditor = createEditor();
        noteEditor.children = store.getState().notes[noteId].content;
        Transforms.setNodes(noteEditor, newProperties, { at: path });

        store.getState().updateNote({ id: noteId, content: noteEditor.children });

        const encryptedContent = encrypt(noteEditor.children, key);
        await updateNote({ id: noteId, content: encryptedContent });
        setIsOpen(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : e;
        console.error(`There was an error updating the language: ${message}`);
      }
    },
    [editor, readOnly, key, noteId, path],
  );

  const convertToMermaid = useCallback(() => {
    const graphDefinition = Array.from(Editor.nodes(editor, { at: path, match: n => n.type === ElementType.CodeLine }))
      .map(entry => entry[0])
      .map(line => Node.string(line))
      .join('\n');
    if (!graphDefinition) return;

    const mermaidDiagram: MermaidDiagram = {
      id: element.id,
      type: ElementType.MermaidDiagram,
      definition: graphDefinition,
      children: [],
    };

    Transforms.removeNodes(editor, { match: n => n.type === ElementType.CodeBlock, at: path });
    Transforms.insertNodes(editor, mermaidDiagram, { at: path });
  }, [editor, path, element.id]);

  useEffect(() => {
    if (lang === 'mermaid' && !isMermaidCodeBlockFocused) {
      convertToMermaid();
    }
  }, [lang, isMermaidCodeBlockFocused, convertToMermaid]);

  return (
    <pre
      className={`block relative p-2 border rounded bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 whitespace-pre-wrap overflow-x-auto ${className}`}
      {...attributes}
    >
      {!readOnly ? (
        <div contentEditable={false} ref={setMenuElement} onClick={() => setIsOpen(!isOpen)}>
          <Select
            className="react-select-container react-select-container-code"
            classNamePrefix="react-select"
            menuPlacement="auto"
            minMenuHeight={366}
            isSearchable={false}
            options={selectOptions}
            value={selectOptions.find(option => option.value === (lang ?? ''))}
            onChange={value => onSelectChange(value?.value ?? '')}
            menuPortalTarget={document.body}
            menuIsOpen={isOpen}
            styles={{
              menuPortal: base => ({ ...base, zIndex: 9999 }),
              menu: base => ({
                ...base,
                margin: 0,
                border: 'unset',
                boxShadow: 'none',
              }),
              menuList: base => ({
                ...base,
                paddingTop: 0,
                paddingBottom: 0,
                minWidth: '100px',
                minHeight: '366px',
                borderRadius: '4px',
                border: darkMode ? '1px solid rgb(64 64 64 / var(--tw-bg-opacity))' : '1px solid lightgray',
                backgroundColor: darkMode ? 'rgb(38 38 38 / var(--tw-bg-opacity))' : 'white',
              }),
              option: base => ({
                ...base,
                fontSize: '0.75rem',
                lineHeight: '0.75rem',
                color: darkMode ? 'white' : 'black',
                backgroundColor: darkMode ? 'rgb(38 38 38 / var(--tw-bg-opacity))' : 'white',
                ':hover': {
                  backgroundColor: darkMode
                    ? 'rgb(64 64 64 / var(--tw-bg-opacity))'
                    : 'rgb(245 245 245 / var(--tw-bg-opacity))',
                },
              }),
            }}
          />
        </div>
      ) : null}
      <code className={`language-${lang ?? ''}`}>{children}</code>
    </pre>
  );
}
