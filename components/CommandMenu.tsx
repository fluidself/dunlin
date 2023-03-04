import type { KeyboardEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Editor, Path, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import {
  IconAsterisk,
  IconBlockquote,
  IconBraces,
  IconBrandYoutube,
  IconFilePlus,
  IconH1,
  IconH2,
  IconH3,
  IconLayoutSidebarRightCollapse,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconMessageDots,
  IconPageBreak,
  IconPaperclip,
  IconPhoto,
  IconSearch,
  IconTable,
  IconTerminal2,
  IconTypography,
  TablerIcon,
} from '@tabler/icons';
import { toast } from 'react-toastify';
import upsertNote from 'lib/api/upsertNote';
import { useStore } from 'lib/store';
import { ElementType } from 'types/slate';
import { useAuth } from 'utils/useAuth';
import mimeTypes from 'utils/mime-types';
import { useCurrentDeck } from 'utils/useCurrentDeck';
import { caseInsensitiveStringEqual } from 'utils/string';
import useCommandMenuSearch from 'utils/useCommandMenuSearch';
import { getDefaultEditorValue } from 'editor/constants';
import useOnNoteLinkClick from 'editor/useOnNoteLinkClick';
import {
  insertCallout,
  insertDetailsDisclosure,
  insertFootnote,
  insertThematicBreak,
  toggleElement,
} from 'editor/formatting';
import { uploadAndInsertFile, uploadAndInsertImage } from 'editor/plugins/withMedia';
import { insertTable, isInTable } from 'editor/plugins/withTables';
import EmbedUrlInput, { type EmbedUrlInputState } from './EmbedUrlInput';

export type CommandMenuState = {
  isVisible: boolean;
  editor?: Editor;
};

export enum OptionType {
  NEW_NOTE,
  NOTE,
  ELEMENT,
}

export type Option = {
  id: string;
  type: OptionType;
  text: string;
  icon?: TablerIcon;
  format?: ElementType;
};

type Props = {
  commandMenuState: CommandMenuState;
  setCommandMenuState: (state: CommandMenuState) => void;
};

export default function CommandMenu(props: Props) {
  const { commandMenuState, setCommandMenuState } = props;
  const { editor } = commandMenuState;
  const { user } = useAuth();
  const { id: deckId } = useCurrentDeck();
  const authorOnlyNotes = useStore(state => state.authorOnlyNotes);
  const lastOpenNoteId = useStore(state => state.openNoteIds[state.openNoteIds.length - 1]);
  const { onClick: onNoteLinkClick } = useOnNoteLinkClick(lastOpenNoteId);

  const [inputText, setInputText] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [embedUrlState, setEmbedUrlState] = useState<EmbedUrlInputState>({ isOpen: false });

  const search = useCommandMenuSearch({ numOfResults: 10, withEditorElements: typeof editor !== 'undefined' });
  const searchResults = useMemo(() => search(inputText), [search, inputText]);
  const inTable = useMemo(() => (editor && isInTable(editor) ? true : false), [editor]);

  const options = useMemo(() => {
    const result: Array<Option> = [];
    const noteResults = searchResults.filter(r => r.item.type === OptionType.NOTE);

    if (inputText && (noteResults.length <= 0 || !caseInsensitiveStringEqual(inputText, noteResults[0].item.title))) {
      result.push({
        id: 'NEW_NOTE',
        type: OptionType.NEW_NOTE,
        text: `New note: ${inputText}`,
        icon: IconFilePlus,
      });
    }
    result.push(
      ...searchResults
        .filter(result => (inTable ? result.item.type !== OptionType.ELEMENT : result))
        .map(result => ({
          id: result.item.id,
          type: result.item.type,
          text: result.item.title,
          ...(result.item.type === OptionType.ELEMENT
            ? {
                icon: allElementOptions.find(c => c.id === result.item.id)?.icon,
                format: allElementOptions.find(c => c.id === result.item.id)?.format,
              }
            : {}),
        })),
    );

    return result.length ? result.sort((a, b) => a.type - b.type) : editor && !inTable ? [...allElementOptions] : [];
  }, [searchResults, inputText, editor, inTable]);

  const hideCommandMenu = useCallback(
    (restoreEditorSelection = true) => {
      if (restoreEditorSelection && editor && editor.selection) {
        Transforms.select(editor, editor.selection);
        ReactEditor.focus(editor);
      }
      setCommandMenuState({ isVisible: false });
    },
    [editor, setCommandMenuState],
  );

  const handleFile = useCallback(
    (onlyImages: boolean, path: Path) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = onlyImages ? 'image/*' : mimeTypes.join();
      input.multiple = false;
      input.className = 'absolute invisible hidden w-0 h-0';

      input.onchange = async e => {
        if (!e.target) {
          document.body.removeChild(input);
          return;
        }

        const inputElement = e.target as HTMLInputElement;

        if (!inputElement.files || inputElement.files.length <= 0) {
          document.body.removeChild(input);
          return;
        }

        if (onlyImages) {
          await uploadAndInsertImage(editor, inputElement.files[0], path);
        } else {
          await uploadAndInsertFile(editor, inputElement.files[0], path);
        }

        document.body.removeChild(input);
      };

      document.body.appendChild(input);
      input.click();
    },
    [editor],
  );

  const onOptionClick = useCallback(
    async (option: Option, stackNote: boolean) => {
      const needsFurtherInput =
        option.format &&
        [ElementType.Embed, ElementType.FileAttachment, ElementType.Image, ElementType.Video].includes(option.format);
      if (!needsFurtherInput) {
        hideCommandMenu(option.type === OptionType.ELEMENT);
      }

      if (option.type === OptionType.NEW_NOTE) {
        if (!deckId || !user) return;

        const newNote = {
          deck_id: deckId,
          user_id: user.id,
          author_only: authorOnlyNotes,
          title: inputText,
          content: getDefaultEditorValue(),
        };
        const note = await upsertNote(newNote);
        if (!note) {
          toast.error(`There was an error creating the note ${inputText}.`);
          return;
        }

        onNoteLinkClick(note.id, stackNote);
      } else if (option.type === OptionType.NOTE) {
        onNoteLinkClick(option.id, stackNote);
      } else if (option.type === OptionType.ELEMENT) {
        if (!option.format || !editor || !editor.selection) return;

        const path = Editor.path(editor, editor.selection, { depth: 1 });

        switch (option.format) {
          case ElementType.Callout:
            insertCallout(editor, path);
            break;
          case ElementType.DetailsDisclosure:
            insertDetailsDisclosure(editor, path);
            break;
          case ElementType.Footnote:
            insertFootnote(editor);
            break;
          case ElementType.FileAttachment:
          case ElementType.Image:
            handleFile(option.format === ElementType.Image, path);
            break;
          case ElementType.Embed:
          case ElementType.Video:
            setEmbedUrlState({ isOpen: true, type: option.format, path, onSubmitCallback: hideCommandMenu });
            break;
          case ElementType.Table:
            insertTable(editor, path);
            break;
          case ElementType.ThematicBreak:
            insertThematicBreak(editor, path);
            break;
          default:
            toggleElement(editor, option.format, path);
        }
      } else {
        throw new Error(`Option type ${option.type} is not supported`);
      }
    },
    [deckId, authorOnlyNotes, user, inputText, editor, onNoteLinkClick, handleFile, hideCommandMenu],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedOptionIndex(index => {
          return index <= 0 ? options.length - 1 : index - 1;
        });
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedOptionIndex(index => {
          return index >= options.length - 1 ? 0 : index + 1;
        });
      } else if (event.key === 'Escape' || (event.key === 'p' && event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        hideCommandMenu();
      }
    },
    [options.length, hideCommandMenu],
  );

  const noteOptions = options.filter(opt => opt.type !== OptionType.ELEMENT);
  const elementOptions = options.filter(opt => opt.type === OptionType.ELEMENT);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black opacity-30"
        onClick={() => setCommandMenuState({ ...commandMenuState, isVisible: false })}
      />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        {embedUrlState.isOpen ? (
          <EmbedUrlInput state={embedUrlState} setState={setEmbedUrlState} />
        ) : (
          <div className="flex flex-col z-30 w-full max-w-screen-sm bg-white rounded shadow-popover dark:bg-gray-800">
            <div className="flex items-center flex-shrink-0 w-full">
              <IconSearch className="ml-4 text-gray-500" size={20} />
              <input
                type="text"
                className="w-full py-4 px-2 text-xl border-none rounded-tl rounded-tr focus:ring-0 dark:bg-gray-800 dark:text-gray-200"
                placeholder={editor && !inTable ? 'Find or create a note or use an element' : 'Find or create a note'}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={onKeyDown}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onOptionClick(options[selectedOptionIndex], event.shiftKey);
                  }
                }}
                autoFocus
              />
            </div>
            {options.length > 0 ? (
              <>
                <div className="flex-1 w-full overflow-y-auto bg-white border-t rounded-bl rounded-br dark:bg-gray-800 dark:border-gray-700">
                  {noteOptions.length > 0 ? <div className="px-4 py-2 select-none text-gray-300">Notes</div> : null}
                  {noteOptions.map(option => {
                    const index = options.findIndex(o => o.id === option.id);
                    return (
                      <OptionItem
                        key={option.id}
                        option={option}
                        isSelected={index === selectedOptionIndex}
                        onClick={(option, stackNote) => onOptionClick(option, stackNote)}
                      />
                    );
                  })}
                  {elementOptions.length > 0 ? (
                    <div className="px-4 py-2 select-none text-gray-300">Editor elements</div>
                  ) : null}
                  {elementOptions.map(option => {
                    const index = options.findIndex(o => o.id === option.id);
                    return (
                      <OptionItem
                        key={option.id}
                        option={option}
                        isSelected={index === selectedOptionIndex}
                        onClick={(option, stackNote) => onOptionClick(option, stackNote)}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-center text-sm select-none text-gray-300 space-x-6 py-1">
                  <div>
                    <span className="text-lg leading-none tracking-tighter">↑↓</span> to navigate
                  </div>
                  <div>
                    <span className="text-lg leading-none">↵</span> to select
                  </div>
                  <div>esc to dismiss</div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

type OptionProps = {
  option: Option;
  isSelected: boolean;
  onClick: (option: Option, stackNote: boolean) => void;
};

const OptionItem = (props: OptionProps) => {
  const { option, isSelected, onClick } = props;

  return (
    <button
      className={`flex flex-row w-full items-center px-6 py-2 text-gray-800 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600 ${
        isSelected && 'bg-gray-100 dark:bg-gray-700'
      }`}
      onClick={e => onClick(option, e.shiftKey)}
    >
      {option.icon ? <option.icon size={18} className="flex-shrink-0 mr-1" /> : null}
      <span className="overflow-hidden overflow-ellipsis whitespace-nowrap">{option.text}</span>
    </button>
  );
};

export const allElementOptions = [
  {
    id: 'paragraph',
    type: OptionType.ELEMENT,
    text: 'Paragraph',
    icon: IconTypography,
    format: ElementType.Paragraph,
  },
  {
    id: 'h1',
    type: OptionType.ELEMENT,
    text: 'Heading 1',
    icon: IconH1,
    format: ElementType.HeadingOne,
  },
  {
    id: 'h2',
    type: OptionType.ELEMENT,
    text: 'Heading 2',
    icon: IconH2,
    format: ElementType.HeadingTwo,
  },
  {
    id: 'h3',
    type: OptionType.ELEMENT,
    text: 'Heading 3',
    icon: IconH3,
    format: ElementType.HeadingThree,
  },
  {
    id: 'bulleted-list',
    type: OptionType.ELEMENT,
    text: 'Bulleted list',
    icon: IconList,
    format: ElementType.BulletedList,
  },
  {
    id: 'numbered-list',
    type: OptionType.ELEMENT,
    text: 'Numbered list',
    icon: IconListNumbers,
    format: ElementType.NumberedList,
  },
  {
    id: 'checklist',
    type: OptionType.ELEMENT,
    text: 'Checklist',
    icon: IconListCheck,
    format: ElementType.CheckListItem,
  },
  {
    id: 'details-disclosure',
    type: OptionType.ELEMENT,
    text: 'Details disclosure',
    icon: IconLayoutSidebarRightCollapse,
    format: ElementType.DetailsDisclosure,
  },
  {
    id: 'code-block',
    type: OptionType.ELEMENT,
    text: 'Code block',
    icon: IconBraces,
    format: ElementType.CodeBlock,
  },
  {
    id: 'blockquote',
    type: OptionType.ELEMENT,
    text: 'Blockquote',
    icon: IconBlockquote,
    format: ElementType.Blockquote,
  },
  {
    id: 'callout',
    type: OptionType.ELEMENT,
    text: 'Callout',
    icon: IconMessageDots,
    format: ElementType.Callout,
  },
  {
    id: 'table',
    type: OptionType.ELEMENT,
    text: 'Table',
    icon: IconTable,
    format: ElementType.Table,
  },
  {
    id: 'image',
    type: OptionType.ELEMENT,
    text: 'Image',
    icon: IconPhoto,
    format: ElementType.Image,
  },
  {
    id: 'video',
    type: OptionType.ELEMENT,
    text: 'Video',
    icon: IconBrandYoutube,
    format: ElementType.Video,
  },
  {
    id: 'embed',
    type: OptionType.ELEMENT,
    text: 'Embed',
    icon: IconTerminal2,
    format: ElementType.Embed,
  },
  {
    id: 'file-attachment',
    type: OptionType.ELEMENT,
    text: 'File attachment',
    icon: IconPaperclip,
    format: ElementType.FileAttachment,
  },
  {
    id: 'thematic-break',
    type: OptionType.ELEMENT,
    text: 'Thematic break',
    icon: IconPageBreak,
    format: ElementType.ThematicBreak,
  },
  {
    id: 'footnote',
    type: OptionType.ELEMENT,
    text: 'Footnote',
    icon: IconAsterisk,
    format: ElementType.Footnote,
  },
];
