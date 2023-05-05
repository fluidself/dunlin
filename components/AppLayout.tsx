import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import colors from 'tailwindcss/colors';
import { useAccount } from 'wagmi';
import useSWR from 'swr';
import isHotkey from 'is-hotkey';
import { useStore, store, NoteTreeItem, getNoteTreeItem, Notes, SidebarTab } from 'lib/store';
import activeEditorsStore from 'lib/activeEditorsStore';
import supabase from 'lib/supabase';
import selectDeckWithNotes from 'lib/api/selectDeckWithNotes';
import { Deck, Contributor } from 'types/supabase';
import { DecryptedDeck, DecryptedNote } from 'types/decrypted';
import { AccessControlCondition } from 'types/lit';
import { ProvideCurrentDeck } from 'utils/useCurrentDeck';
import { decryptWithLit, decryptNote } from 'utils/encryption';
import useHotkeys from 'utils/useHotkeys';
import useIsOffline from 'utils/useIsOffline';
import useLitProtocol from 'utils/useLitProtocol';
import { useAuth } from 'utils/useAuth';
import { configureDeckAccess } from 'utils/accessControl';
import CommandMenu from './command-menu/CommandMenu';
import CreateJoinRenameDeckModal, { CreateJoinRenameDeckType } from './CreateJoinRenameDeckModal';
import ShareModal from './share-modal/ShareModal';
import SettingsModal from './settings/SettingsModal';
import Sidebar from './sidebar/Sidebar';
import PageLoading from './PageLoading';
import ErrorPage from './ErrorPage';
import OfflineBanner from './OfflineBanner';
import UpdateBanner from './UpdateBanner';

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AppLayout(props: Props) {
  const { children, className = '' } = props;

  useIsOffline();
  const router = useRouter();
  const { isReady: litReady, isError: litError } = useLitProtocol();
  const deckId = Array.isArray(router.query.deckId) ? router.query.deckId[0] : (router.query.deckId as string);
  const { user, isLoaded, signOut } = useAuth();
  const { connector } = useAccount();
  const { data, error: dataFetchError } = useSWR(deckId ? 'deck-with-notes' : null, () => selectDeckWithNotes(deckId));
  const { dbDeck, dbNotes } = data || {};
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deck, setDeck] = useState<DecryptedDeck>();
  const [deckKey, setDeckKey] = useState('');
  const [processingAccess, setProcessingAccess] = useState(false);

  const isOffline = useStore(state => state.isOffline);
  const darkMode = useStore(state => state.darkMode);
  const shareModalOpen = useStore(state => state.shareModalOpen);
  const commandMenuState = useStore(state => state.commandMenuState);
  const isDaemonUser = useStore(state => state.isDaemonUser);
  const setStoreDeckKey = useStore(state => state.setDeckKey);
  const setNotes = useStore(state => state.setNotes);
  const setNoteTree = useStore(state => state.setNoteTree);
  const setUserId = useStore(state => state.setUserId);
  const setDeckId = useStore(state => state.setDeckId);
  const setCollaborativeDeck = useStore(state => state.setCollaborativeDeck);
  const setAuthorOnlyNotes = useStore(state => state.setAuthorOnlyNotes);
  const setShareModalOpen = useStore(state => state.setShareModalOpen);
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const setSidebarTab = useStore(state => state.setSidebarTab);
  const setCommandMenuState = useStore(state => state.setCommandMenuState);
  const setIsDaemonUser = useStore(state => state.setIsDaemonUser);

  useEffect(() => {
    const onDisconnect = () => signOut();
    connector?.on('disconnect', onDisconnect);

    return () => {
      connector?.off('disconnect', onDisconnect);
    };
  }, [connector, signOut]);

  const setupStore = useCallback(async () => {
    if (!isPageLoaded && isLoaded && user) {
      // Use user's specific store and rehydrate data
      useStore.persist.clearStorage();
      useStore.persist.setOptions({
        name: `dunlin-storage-${user.id}`,
      });
      await useStore.persist.rehydrate();
    }
  }, [isPageLoaded, isLoaded, user]);

  useEffect(() => {
    setupStore();
  }, [setupStore]);

  const resetDeck = useCallback(
    async (deleteContributor = false) => {
      toast.error('Unable to verify access');
      if (deleteContributor && deckId && user?.id) {
        await supabase
          .from<Contributor>('contributors')
          .delete()
          .match({ deck_id: deckId, user_id: user?.id })
          .single();
      }
      await fetch('/api/reset-recent-deck', { method: 'POST' });
      router.push('/');
    },
    [deckId, user?.id, router],
  );

  const decryptDeck = useCallback(
    async (dbDeck: Deck) => {
      try {
        const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = dbDeck.access_params;
        const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
        setDeckKey(deckKey);
        return deckKey;
      } catch (error) {
        return resetDeck(dbDeck.user_id !== user?.id);
      }
    },
    [user?.id, resetDeck],
  );

  const prepareData = useCallback(async () => {
    if (!user || !dbDeck || isOffline) return;

    setDeckId(deckId);
    setUserId(user.id);

    if (process.env.NEXT_PUBLIC_DAEMON_USERS?.split(',').includes(user.id)) {
      setIsDaemonUser(true);
    }

    const {
      access_params: { access_control_conditions },
      ...rest
    } = dbDeck;
    const key = deckKey ? deckKey : await decryptDeck(dbDeck);
    if (!key) return;

    const decryptedDeck: DecryptedDeck = {
      ...rest,
      access_control_conditions,
      key,
    };

    setDeck(decryptedDeck);
    setCollaborativeDeck(decryptedDeck.access_control_conditions.length > 1);
    setAuthorOnlyNotes(decryptedDeck.author_only_notes ?? false);

    if (!dbNotes?.length) {
      setIsPageLoaded(true);
      return;
    }

    // Redirect to most recent note or first note in database
    if (router.pathname.match(/^\/app\/[^/]+$/i)) {
      const openNoteIds = store.getState().openNoteIds;
      if (openNoteIds.length > 0 && dbNotes && dbNotes.findIndex(note => note.id === openNoteIds[0]) > -1) {
        router.replace(`/app/${deckId}/note/${openNoteIds[0]}`);
        return;
      } else if (dbNotes && dbNotes.length > 0) {
        router.replace(`/app/${deckId}/note/${dbNotes[0].id}`);
        return;
      }
    }

    // Decrypt, sort, and set notes
    const notes = dbNotes
      .map(note => decryptNote(note, key))
      .sort((a, b) => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1));

    const notesAsObj = notes.reduce<Record<DecryptedNote['id'], DecryptedNote>>((acc, note) => {
      acc[note.id] = note;
      return acc;
    }, {});
    setNotes(notesAsObj);
    setStoreDeckKey(key);

    // Set note tree
    if (decryptedDeck.note_tree) {
      const noteTree: NoteTreeItem[] = [...decryptedDeck.note_tree];
      // This is a sanity check for removing notes in the noteTree that do not exist
      removeNonexistentNotes(noteTree, notesAsObj);
      // If there are notes that are not in the note tree, add them
      // This is a sanity check to make sure there are no orphaned notes
      for (const note of notes) {
        if (getNoteTreeItem(noteTree, note.id) === null) {
          noteTree.push({ id: note.id, children: [], collapsed: true });
        }
      }
      // Use the note tree saved in the database
      setNoteTree(noteTree);
    } else {
      // No note tree in database, just use notes
      setNoteTree(notes.map(note => ({ id: note.id, children: [], collapsed: true })));
    }

    setIsPageLoaded(true);
  }, [
    deckId,
    user,
    router,
    deckKey,
    isOffline,
    dbDeck,
    dbNotes,
    setNotes,
    setNoteTree,
    setDeckId,
    setStoreDeckKey,
    setUserId,
    decryptDeck,
    setAuthorOnlyNotes,
    setCollaborativeDeck,
    setIsDaemonUser,
  ]);

  useEffect(() => {
    if (isLoaded && !user) {
      // Redirect to root page if there is no user logged in
      router.replace('/');
    } else if (litError) {
      console.error('Could not connect to Lit network');
      return;
    } else if (isLoaded && user && litReady && dbDeck?.id === deckId && !isPageLoaded) {
      // Initialize data if there is a user and the data has not been initialized yet
      prepareData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, user, isLoaded, litReady, litError, dbDeck, deckId, isPageLoaded]);

  const dbNoteTree = useMemo(() => JSON.stringify(dbDeck?.note_tree), [dbDeck?.note_tree]);

  useEffect(() => {
    if (isPageLoaded) {
      prepareData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbNoteTree]);

  useEffect(() => {
    if (dataFetchError) {
      resetDeck();
    }
  }, [dataFetchError, resetDeck]);

  useEffect(() => {
    const handleNoteSelect = (event: KeyboardEvent) => {
      if (isHotkey(['mod+1', 'mod+2', 'mod+3', 'mod+4', 'mod+5', 'mod+6', 'mod+7', 'mod+8', 'mod+9'], event)) {
        const commandMenuVisible = store.getState().commandMenuState.isVisible;
        const openNoteIds = store.getState().openNoteIds;
        if (commandMenuVisible || openNoteIds.length < 2) return;

        try {
          const noteIdToSelect = openNoteIds[+event.key - 1];
          const editor = activeEditorsStore.getActiveEditor(noteIdToSelect);
          if (!editor) return;
          const locationToSelect = editor.selection ?? {
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 0], offset: 0 },
          };
          Editor.withoutNormalizing(editor, () => {
            ReactEditor.deselect(editor);
            Transforms.select(editor, locationToSelect);
          });
          ReactEditor.focus(editor);
          event.preventDefault();
          event.stopPropagation();
        } catch (e) {
          // Do nothing.
        }
      }
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.addEventListener('keydown', handleNoteSelect);
      return () => document.removeEventListener('keydown', handleNoteSelect);
    }
  }, []);

  const [createJoinRenameModal, setCreateJoinRenameModal] = useState<{
    open: boolean;
    type: CreateJoinRenameDeckType;
    deckId?: string;
    deckName?: string;
  }>({
    open: false,
    type: CreateJoinRenameDeckType.None,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'mod+p',
        callback: () => {
          if (commandMenuState.isVisible) {
            const editor = activeEditorsStore.getActiveEditor(commandMenuState.activeEditor ?? '');
            if (editor && editor.selection) {
              Transforms.select(editor, editor.selection);
              ReactEditor.focus(editor);
            }
            setCommandMenuState({ isVisible: false, activeEditor: undefined });
          } else if (!commandMenuState.isVisible) {
            setCommandMenuState({ isVisible: true, activeEditor: undefined });
          }
        },
      },
      {
        hotkey: 'mod+s',
        callback: () => {
          /* todo: placeholder for saving */
        },
      },
      {
        hotkey: 'mod+shift+e',
        callback: () => {
          setIsSidebarOpen(true);
          setSidebarTab(SidebarTab.Notes);
        },
      },
      {
        hotkey: 'mod+shift+f',
        callback: () => {
          setIsSidebarOpen(true);
          setSidebarTab(SidebarTab.Search);
        },
      },
      {
        hotkey: 'mod+shift+g',
        callback: () => router.push(`/app/${deckId}/graph`),
      },
      {
        hotkey: 'mod+shift+d',
        callback: () => {
          if (isDaemonUser) {
            router.push(`/app/${deckId}/daemon`);
          }
        },
      },
      {
        hotkey: 'mod+\\',
        callback: () => setIsSidebarOpen(isOpen => !isOpen),
      },
    ],
    [setSidebarTab, setCommandMenuState, setIsSidebarOpen, router, deckId, commandMenuState, isDaemonUser],
  );
  useHotkeys(hotkeys);

  const updateDeckAccess = async (acc: AccessControlCondition[]) => {
    if (!deckId || !user?.id || !deck?.key || !acc) return;
    setProcessingAccess(true);
    const success = await configureDeckAccess(deckId, user.id, deck?.key, acc);

    if (success) {
      toast.success('Access to workspace was configured');
      setProcessingAccess(false);
      return true;
    } else {
      toast.error('Provisioning access failed');
      setProcessingAccess(false);
    }
  };

  const appContainerClassName = classNames('h-screen', { dark: darkMode }, className);

  if (litError) {
    return <ErrorPage />;
  }
  if (!isPageLoaded || !deckId) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <meta name="theme-color" content={darkMode ? colors.neutral[900] : colors.white} />
      </Head>
      <ProvideCurrentDeck deck={deck}>
        <div id="app-container" className={appContainerClassName}>
          <div className="flex w-full h-full dark:bg-gray-900">
            <Sidebar setIsSettingsOpen={setIsSettingsOpen} setCreateJoinRenameModal={setCreateJoinRenameModal} />
            <div className="relative flex flex-col flex-1 overflow-y-hidden">
              <OfflineBanner />
              <UpdateBanner />
              {children}
            </div>
            {isSettingsOpen ? (
              <SettingsModal setIsOpen={setIsSettingsOpen} setCreateJoinRenameModal={setCreateJoinRenameModal} />
            ) : null}
            {commandMenuState.isVisible ? <CommandMenu /> : null}
            {createJoinRenameModal.open && (
              <CreateJoinRenameDeckModal
                type={createJoinRenameModal.type}
                deckId={createJoinRenameModal.deckId}
                deckName={createJoinRenameModal.deckName}
                closeModal={() => setCreateJoinRenameModal({ open: false, type: CreateJoinRenameDeckType.None })}
              />
            )}
            {shareModalOpen && (
              <ShareModal
                onClose={() => setShareModalOpen(false)}
                deckToShare={deckId}
                processingAccess={processingAccess}
                onAccessControlConditionsSelected={updateDeckAccess}
                showStep={'ableToAccess'}
              />
            )}
          </div>
        </div>
      </ProvideCurrentDeck>
    </>
  );
}

const removeNonexistentNotes = (tree: NoteTreeItem[], notes: Notes) => {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (!notes[item.id]) {
      tree.splice(i, 1);
    } else if (item.children.length > 0) {
      removeNonexistentNotes(item.children, notes);
    }
  }
};
