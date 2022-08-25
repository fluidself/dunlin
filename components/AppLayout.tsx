import LitJsSdk from 'lit-js-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import colors from 'tailwindcss/colors';
import { useAccount } from 'wagmi';
import { useStore, store, NoteTreeItem, getNoteTreeItem, Notes, SidebarTab } from 'lib/store';
import supabase from 'lib/supabase';
import { Note, Deck } from 'types/supabase';
import { DecryptedDeck, DecryptedNote } from 'types/decrypted';
import { ProvideCurrentDeck } from 'utils/useCurrentDeck';
import { decryptWithLit, decryptNote } from 'utils/encryption';
import useIsMounted from 'utils/useIsMounted';
import useHotkeys from 'utils/useHotkeys';
import { useAuth } from 'utils/useAuth';
import { isMobile } from 'utils/device';
import CreateJoinRenameDeckModal, { CreateJoinRenameDeckType } from './CreateJoinRenameDeckModal';
import SettingsModal from './settings/SettingsModal';
import Sidebar from './sidebar/Sidebar';
import FindOrCreateModal from './FindOrCreateModal';
import PageLoading from './PageLoading';
import OfflineBanner from './OfflineBanner';

type Props = {
  children: ReactNode;
  className?: string;
};

export default function AppLayout(props: Props) {
  const { children, className = '' } = props;

  const router = useRouter();
  const deckId = Array.isArray(router.query.deckId) ? router.query.deckId[0] : router.query.deckId;
  const { user, isLoaded, signOut } = useAuth();
  const [{ data: accountData }] = useAccount();
  const isMounted = useIsMounted();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deck, setDeck] = useState<DecryptedDeck>();

  useEffect(() => {
    const onDisconnect = () => signOut();
    accountData?.connector?.on('disconnect', onDisconnect);

    return () => {
      accountData?.connector?.off('disconnect', onDisconnect);
    };
  }, [accountData?.connector, signOut]);

  useEffect(() => {
    if (!isPageLoaded && isLoaded && user) {
      // Use user's specific store and rehydrate data
      useStore.persist.setOptions({
        name: `deck-storage-${user.id}`,
      });
      useStore.persist.rehydrate();
    }
  }, [isPageLoaded, isLoaded, user]);

  const setNotes = useStore(state => state.setNotes);
  const setNoteTree = useStore(state => state.setNoteTree);
  const setUserId = useStore(state => state.setUserId);
  const setDeckId = useStore(state => state.setDeckId);
  const setDeckKey = useStore(state => state.setDeckKey);
  const setAuthorOnlyNotes = useStore(state => state.setAuthorOnlyNotes);

  const initLit = async () => {
    const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
    await client.connect();
    window.litNodeClient = client;
  };

  const decryptDeck = useCallback(async () => {
    try {
      const { data: dbDeck, error } = await supabase.from<Deck>('decks').select('*').match({ id: deckId }).single();
      if (!dbDeck || error) throw new Error(error?.message);

      const {
        access_params: { encrypted_string, encrypted_symmetric_key, access_control_conditions },
        ...rest
      } = dbDeck;
      const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
      const decryptedDeck: DecryptedDeck = {
        ...rest,
        access_control_conditions,
        key: deckKey,
      };

      return decryptedDeck;
    } catch (error) {
      toast.error('Unable to decrypt DECK');
      await fetch('/api/reset-recent-deck', { method: 'POST' });
      router.push('/app');
      return;
    }
  }, [deckId, router]);

  const initData = useCallback(async () => {
    if (!window.litNodeClient && isMounted()) {
      await initLit();
    }

    if (!deckId || !user) return;
    setDeckId(deckId);
    setUserId(user.id);

    const decryptedDeck = deck ?? (await decryptDeck());
    setDeck(decryptedDeck);
    setAuthorOnlyNotes(decryptedDeck?.author_only_notes ?? false);
    if (!decryptedDeck?.key) return;
    setDeckKey(decryptedDeck.key);

    const { data: encryptedNotes } = await supabase
      .from<Note>('notes')
      .select('id, title, content, user_id, author_only, created_at, updated_at')
      .eq('deck_id', deckId);

    if (!encryptedNotes) {
      setIsPageLoaded(true);
      return;
    }

    const notes = encryptedNotes
      .map(note => decryptNote(note, decryptedDeck.key))
      .sort((a, b) => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1));

    // Redirect to most recent note or first note in database
    if (router.pathname.match(/^\/app\/[^/]+$/i)) {
      const openNoteIds = store.getState().openNoteIds;
      if (openNoteIds.length > 0 && notes && notes.findIndex(note => note.id === openNoteIds[0]) > -1) {
        router.replace(`/app/${deckId}/note/${openNoteIds[0]}`);
        return;
      } else if (notes && notes.length > 0) {
        router.replace(`/app/${deckId}/note/${notes[0].id}`);
        return;
      }
    }

    // Set notes
    const notesAsObj = notes.reduce<Record<DecryptedNote['id'], DecryptedNote>>((acc, note) => {
      acc[note.id] = note;
      return acc;
    }, {});
    setNotes(notesAsObj);

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
    deck,
    user,
    isMounted,
    router,
    setNotes,
    setNoteTree,
    setDeckId,
    decryptDeck,
    setDeckKey,
    setUserId,
    setAuthorOnlyNotes,
  ]);

  useEffect(() => {
    if (isLoaded && !user) {
      // Redirect to root page if there is no user logged in
      router.replace('/');
    } else if (!isPageLoaded && isLoaded && user) {
      // Initialize data if there is a user and the data has not been initialized yet
      initData();
    }
  }, [router, user, isLoaded, isPageLoaded, initData]);

  const [isFindOrCreateModalOpen, setIsFindOrCreateModalOpen] = useState(false);
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

  // const darkMode = useStore(state => state.darkMode);
  const darkMode = true;
  const setIsSidebarOpen = useStore(state => state.setIsSidebarOpen);
  const setIsPageStackingOn = useStore(state => state.setIsPageStackingOn);
  const setSidebarTab = useStore(state => state.setSidebarTab);

  const upsertNote = useStore(state => state.upsertNote);
  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);

  const hasHydrated = useStore(state => state._hasHydrated);
  useEffect(() => {
    // If the user is mobile, the persisted data has been hydrated, and there are no open note ids (a proxy for the first load),
    // change the initial values of isSidebarOpen and isPageStackingOn to better suit mobile devices
    // We need to wait until after hydration because otherwise the persisted state gets overridden and thrown away
    // After https://github.com/pmndrs/zustand/issues/562 is fixed, we can change this
    if (isMobile() && hasHydrated && store.getState().openNoteIds.length === 0) {
      setIsSidebarOpen(false);
      setIsPageStackingOn(false);
    }
  }, [setIsSidebarOpen, setIsPageStackingOn, hasHydrated]);

  useEffect(() => {
    if (!deckId) {
      return;
    }

    // Subscribe to changes on the notes table for the current DECK
    const notesSubscription = supabase
      .from<Note>(`notes:deck_id=eq.${deckId}`)
      .on('*', payload => {
        if (payload.eventType === 'INSERT') {
          if (!deck?.key) return;
          const note = decryptNote(payload.new, deck.key);
          upsertNote(note);
        } else if (payload.eventType === 'UPDATE') {
          if (!deck?.key) return;
          // Don't update the note if it is currently open
          const openNoteIds = store.getState().openNoteIds;
          if (!openNoteIds.includes(payload.new.id)) {
            const note = decryptNote(payload.new, deck.key);
            updateNote(note);
          }
        } else if (payload.eventType === 'DELETE') {
          deleteNote(payload.old.id);
        }
      })
      .subscribe();

    // Subscribe to changes in the note_tree for the current DECK
    const deckSubscription = supabase
      .from<Deck>(`decks:id=eq.${deckId}`)
      .on('UPDATE', payload => {
        if (payload.new.note_tree) {
          const noteTree: NoteTreeItem[] = [...payload.new.note_tree];
          const notesAsObj = store.getState().notes;
          const notes = Object.values(notesAsObj);
          removeNonexistentNotes(noteTree, notesAsObj);
          setNoteTree(noteTree);
          for (const note of notes) {
            if (getNoteTreeItem(noteTree, note.id) === null) {
              initData();
            }
          }
        }
      })
      .subscribe();

    window.addEventListener('focus', initData);

    return () => {
      notesSubscription.unsubscribe();
      deckSubscription.unsubscribe();
      window.removeEventListener('focus', initData);
    };
  }, [deckId, deck, upsertNote, updateNote, deleteNote, setNoteTree, initData]);

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'mod+p',
        callback: () => setIsFindOrCreateModalOpen(isOpen => !isOpen),
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
        hotkey: 'mod+\\',
        callback: () => setIsSidebarOpen(isOpen => !isOpen),
      },
    ],
    [setIsFindOrCreateModalOpen, setSidebarTab, setIsSidebarOpen, router, deckId],
  );
  useHotkeys(hotkeys);

  const appContainerClassName = classNames('h-screen font-display', { dark: darkMode }, className);

  if (!isPageLoaded) {
    return <PageLoading />;
  }

  if (!deckId || typeof deckId !== 'string') {
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
            <Sidebar
              setIsFindOrCreateModalOpen={setIsFindOrCreateModalOpen}
              setIsSettingsOpen={setIsSettingsOpen}
              setCreateJoinRenameModal={setCreateJoinRenameModal}
            />
            <div className="relative flex flex-col flex-1 overflow-y-hidden">
              <OfflineBanner />
              {children}
            </div>
            {isSettingsOpen ? (
              <SettingsModal setIsOpen={setIsSettingsOpen} setCreateJoinRenameModal={setCreateJoinRenameModal} />
            ) : null}
            {isFindOrCreateModalOpen ? <FindOrCreateModal setIsOpen={setIsFindOrCreateModalOpen} /> : null}
            {createJoinRenameModal.open && (
              <CreateJoinRenameDeckModal
                type={createJoinRenameModal.type}
                deckId={createJoinRenameModal.deckId}
                deckName={createJoinRenameModal.deckName}
                closeModal={() => setCreateJoinRenameModal({ open: false, type: CreateJoinRenameDeckType.None })}
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
