// @ts-ignore
import LitJsSdk from 'lit-js-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import classNames from 'classnames';
import { IconAlertTriangle } from '@tabler/icons';
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
  const {
    query: { deckId },
  } = router;
  const { user, isLoaded, signOut } = useAuth();
  const [{ data: accountData }] = useAccount();
  const isMounted = useIsMounted();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [deck, setDeck] = useState<DecryptedDeck>();

  const UpgradeMsg = () => (
    <div>
      <div className="flex items-center flex-shrink-0 w-full mb-2">
        <IconAlertTriangle className="mr-2" size={24} />
        <span className="text-lg ">Upcoming Breaking Release</span>
      </div>
      <p>
        On June 1st, a new version of this app will be released with significant improvements to the storage layer. The good news
        is that the app will become better. The bad news is that current DECKs and notes will not be transferred over.
      </p>
      <br />
      <p>
        If you want to conserve your notes, please use the export functionality found in the top right dropdown menu to save your
        notes in markdown format. After the new release, you can then create a new DECK and import your notes.
      </p>
      <br />
      <p>Thank you for using DECK and hope to see you on the other side.</p>
    </div>
  );

  useEffect(() => {
    toast.warn(<UpgradeMsg />, {
      icon: false,
      autoClose: false,
      closeButton: true,
      draggable: false,
      style: { width: '510px' },
    });
  }, []);

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
  const setDeckId = useStore(state => state.setDeckId);

  const initLit = async () => {
    const client = new LitJsSdk.LitNodeClient({ alertWhenUnauthorized: false, debug: false });
    await client.connect();
    window.litNodeClient = client;
  };

  const initData = useCallback(async () => {
    if (!window.litNodeClient && isMounted()) {
      await initLit();
    }

    if (!deckId || typeof deckId !== 'string') {
      return;
    }
    setDeckId(deckId);

    try {
      const { data: deck, error } = await supabase.from<Deck>('decks').select('*').match({ id: deckId }).single();
      if (!deck || error) throw new Error(error?.message);

      const {
        access_params: { encrypted_string, encrypted_symmetric_key, access_control_conditions },
        ...rest
      } = deck;
      const deckKey = await decryptWithLit(encrypted_string, encrypted_symmetric_key, access_control_conditions);
      const decryptedDeck: DecryptedDeck = {
        ...rest,
        key: deckKey,
      };

      setDeck(decryptedDeck);

      const { data: encryptedNotes } = await supabase
        .from<Note>('notes')
        .select('id, title, content, created_at, updated_at')
        .eq('deck_id', deckId);

      if (!encryptedNotes) {
        setIsPageLoaded(true);
        return;
      }

      const notes: DecryptedNote[] = [];
      for (const note of encryptedNotes) {
        const decryptedNote = await decryptNote(deckKey, note);
        if (decryptedNote) notes.push(decryptedNote);
      }
      notes.sort((a, b) => (a.title < b.title ? -1 : 1));

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
      const notesAsObj = notes.reduce<Record<Note['id'], DecryptedNote>>((acc, note) => {
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
    } catch (error) {
      console.error(error);
      // TODO: handle decryption error
      // redirect somewhere?
    }
  }, [deckId, router, setNotes, setNoteTree, setDeckId]);

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
  // const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    const subscription = supabase
      .from<Note>(`notes:deck_id=eq.${deckId}`)
      .on('*', async payload => {
        if (payload.eventType === 'INSERT') {
          if (!deck?.key) return;
          const note = await decryptNote(deck.key, payload.new);
          if (note) upsertNote(note);
        } else if (payload.eventType === 'UPDATE') {
          if (!deck?.key) return;
          // Don't update the note if it is currently open
          const openNoteIds = store.getState().openNoteIds;
          if (!openNoteIds.includes(payload.new.id)) {
            const note = await decryptNote(deck.key, payload.new);
            if (note) updateNote(note);
          }
        } else if (payload.eventType === 'DELETE') {
          deleteNote(payload.old.id);
        }
      })
      .subscribe();

    window.addEventListener('focus', initData);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', initData);
    };
  }, [deckId, deck, upsertNote, updateNote, deleteNote, initData]);

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
        callback: () => setSidebarTab(SidebarTab.Notes),
      },
      {
        hotkey: 'mod+shift+f',
        callback: () => setSidebarTab(SidebarTab.Search),
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
            <Sidebar setIsFindOrCreateModalOpen={setIsFindOrCreateModalOpen} />
            <div className="relative flex flex-col flex-1 overflow-y-hidden">
              <OfflineBanner />
              {children}
            </div>
            {isFindOrCreateModalOpen ? <FindOrCreateModal setIsOpen={setIsFindOrCreateModalOpen} /> : null}
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
