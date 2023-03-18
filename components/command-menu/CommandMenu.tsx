import { useCallback, useEffect, useMemo, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import isHotkey from 'is-hotkey';
import { useStore } from 'lib/store';
import activeEditorsStore from 'lib/activeEditorsStore';
import EmbedUrlInput, { type EmbedUrlInputState } from 'components/EmbedUrlInput';
import CommandMenuSearch from './CommandMenuSearch';

export enum CommandMenuMode {
  SEARCH,
  EMBED_INPUT,
}

export default function CommandMenu() {
  const setCommandMenuState = useStore(state => state.setCommandMenuState);
  const activeEditor = useStore(state => state.commandMenuState.activeEditor);
  const editor = useMemo(() => activeEditorsStore.getActiveEditor(activeEditor ?? ''), [activeEditor]);
  const [selectedMode, setSelectedMode] = useState(CommandMenuMode.SEARCH);
  const [embedUrlState, setEmbedUrlState] = useState<EmbedUrlInputState>({ isOpen: false });

  const hideCommandMenu = useCallback(
    (restoreEditorSelection = true) => {
      if (restoreEditorSelection && editor && editor.selection) {
        Transforms.select(editor, editor.selection);
        ReactEditor.focus(editor);
      }
      setCommandMenuState({ isVisible: false, activeEditor: undefined });
    },
    [editor, setCommandMenuState],
  );

  useEffect(() => {
    const handleHotkeys = (event: KeyboardEvent) => {
      if (isHotkey(['esc', 'mod+p'], event)) {
        event.preventDefault();
        event.stopPropagation();
        hideCommandMenu();
      }
    };
    document.addEventListener('keydown', handleHotkeys);
    return () => document.removeEventListener('keydown', handleHotkeys);
  }, [hideCommandMenu]);

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => hideCommandMenu()} />
      <div className="flex justify-center px-6 max-h-screen-80 my-screen-10" id="command-menu-modal">
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
