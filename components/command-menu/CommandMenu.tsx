import { useCallback, useState } from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import EmbedUrlInput, { type EmbedUrlInputState } from 'components/EmbedUrlInput';
import CommandMenuSearch from './CommandMenuSearch';

export type CommandMenuState = {
  isVisible: boolean;
  editor?: Editor;
};

export enum CommandMenuMode {
  SEARCH,
  EMBED_INPUT,
}

type Props = {
  commandMenuState: CommandMenuState;
  setCommandMenuState: (state: CommandMenuState) => void;
};

export default function CommandMenu(props: Props) {
  const { commandMenuState, setCommandMenuState } = props;
  const { editor } = commandMenuState;
  const [selectedMode, setSelectedMode] = useState(CommandMenuMode.SEARCH);
  const [embedUrlState, setEmbedUrlState] = useState<EmbedUrlInputState>({ isOpen: false });

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

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => hideCommandMenu()} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10">
        {selectedMode === CommandMenuMode.SEARCH && (
          <CommandMenuSearch
            editor={editor}
            setEmbedUrlState={setEmbedUrlState}
            hideCommandMenu={hideCommandMenu}
            setSelectedMode={setSelectedMode}
          />
        )}
        {selectedMode === CommandMenuMode.EMBED_INPUT && (
          <EmbedUrlInput state={embedUrlState} setState={setEmbedUrlState} />
        )}
      </div>
    </div>
  );
}
