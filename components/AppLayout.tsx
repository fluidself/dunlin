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
import { Note, Deck, Contributor } from 'types/supabase';
import { DecryptedDeck, DecryptedNote } from 'types/decrypted';
import { ProvideCurrentDeck } from 'utils/useCurrentDeck';
import { decryptWithLit, decryptNote } from 'utils/encryption';
import useIsMounted from 'utils/useIsMounted';
import useHotkeys from 'utils/useHotkeys';
import useIsOffline from 'utils/useIsOffline';
import { useAuth } from 'utils/useAuth';
import { isMobile } from 'utils/device';
import CreateJoinRenameDeckModal, { CreateJoinRenameDeckType } from './CreateJoinRenameDeckModal';
import SettingsModal from './settings/SettingsModal';
import Sidebar from './sidebar/Sidebar';
import FindOrCreateModal from './FindOrCreateModal';
import PageLoading from './PageLoading';
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

  const deckKey = useStore(state => state.deckKey);
  const setDeckKey = useStore(state => state.setDeckKey);
  const setNotes = useStore(state => state.setNotes);
  const setNoteTree = useStore(state => state.setNoteTree);
  const setUserId = useStore(state => state.setUserId);
  const setDeckId = useStore(state => state.setDeckId);
  const setCollaborativeDeck = useStore(state => state.setCollaborativeDeck);
  const setAuthorOnlyNotes = useStore(state => state.setAuthorOnlyNotes);

  const initLit = async () => {
    const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
    await client.connect();
    window.litNodeClient = client;
  };

  const decryptDeck = useCallback(
    async (dbDeck: Deck) => {
      try {
        const { encrypted_string, encrypted_symmetric_key, access_control_conditions } = dbDeck.access_params;
        const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);

        return deckKey;
      } catch (error) {
        toast.error('Unable to verify access');
        await supabase.from<Contributor>('contributors').delete().match({ deck_id: deckId, user_id: user?.id }).single();
        await fetch('/api/reset-recent-deck', { method: 'POST' });
        router.push('/app');
        return;
      }
    },
    [deckId, router, user?.id],
  );

  const initData = useCallback(async () => {
    if (!window.litNodeClient && isMounted()) {
      await initLit();
    }

    if (!deckId || !user) return;
    setDeckId(deckId);
    setUserId(user.id);

    const { data: dbDeck } = await supabase.from<Deck>('decks').select('*').match({ id: deckId }).single();
    if (!dbDeck) {
      toast.error('Unable to verify access');
      await fetch('/api/reset-recent-deck', { method: 'POST' });
      router.push('/app');
      return;
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
    setDeckKey(key);

    const { data: encryptedNotes } = await supabase
      .from<Note>('notes')
      .select('id, title, content, user_id, author_only, created_at, updated_at')
      .eq('deck_id', deckId);

    if (!encryptedNotes) {
      setIsPageLoaded(true);
      return;
    }

    const notes = encryptedNotes
      .map(note => decryptNote(note, key))
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
    user,
    router,
    deckKey,
    isMounted,
    setNotes,
    setNoteTree,
    setDeckId,
    setDeckKey,
    setUserId,
    decryptDeck,
    setAuthorOnlyNotes,
    setCollaborativeDeck,
  ]);

  useEffect(() => {
    if (isLoaded && !user) {
      // Redirect to root page if there is no user logged in
      router.replace('/');
    } else if (isLoaded && user && !isPageLoaded) {
      // Initialize data if there is a user and the data has not been initialized yet
      initData();
    }

    window.addEventListener('focus', initData);

    return () => {
      window.removeEventListener('focus', initData);
    };
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

  if (!isPageLoaded || !deckId || typeof deckId !== 'string') {
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
              <UpdateBanner />
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
