import create from 'zustand';
import createVanilla from 'zustand/vanilla';
import { persist, StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Draft } from 'immer';
import localforage from 'localforage';
import type { DecryptedNote } from 'types/decrypted';
import { caseInsensitiveStringEqual } from 'utils/string';
import { Backlink } from 'editor/backlinks/useBacklinks';
import type { PickPartial } from 'types/utils';
import createUserSettingsSlice, { UserSettings } from './createUserSettingsSlice';
import createDaemonSlice, { DaemonStore } from './createDaemonSlice';

export { default as shallowEqual } from 'zustand/shallow';

localforage.config({
  name: 'dunlin',
  version: 1.0,
  storeName: 'dunlin_data',
});

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await localforage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

export type Notes = Record<DecryptedNote['id'], DecryptedNote>;

export type NoteTreeItem = {
  id: DecryptedNote['id'];
  children: NoteTreeItem[];
  collapsed: boolean;
};

export enum SidebarTab {
  Notes,
  Search,
}

export enum DaemonModel {
  'gpt-3.5-turbo' = 'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k' = 'gpt-3.5-turbo-16k',
  'gpt-4' = 'gpt-4',
}

type CommandMenuState = {
  isVisible: boolean;
  activeEditor?: string;
};

type NoteUpdate = PickPartial<
  DecryptedNote,
  'deck_id' | 'user_id' | 'content' | 'title' | 'author_only' | 'created_at' | 'updated_at'
>;

export type Store = {
  notes: Notes;
  setNotes: Setter<Notes>;
  upsertNote: (note: DecryptedNote) => void;
  updateNote: (note: NoteUpdate) => void;
  deleteNote: (noteId: string) => void;
  openNoteIds: string[];
  setOpenNoteIds: (openNoteIds: string[], index?: number) => void;
  activeNoteId: string;
  setActiveNoteId: Setter<string>;
  noteTree: NoteTreeItem[];
  setNoteTree: Setter<NoteTreeItem[]>;
  moveNoteTreeItem: (noteId: string, newParentNoteId: string | null) => void;
  toggleNoteTreeItemCollapsed: (noteId: string) => void;
  blockIdToBacklinksMap: Record<string, Backlink[] | undefined>;
  setBlockIdToBacklinksMap: Setter<Record<string, Backlink[] | undefined>>;
  sidebarTab: SidebarTab;
  setSidebarTab: Setter<SidebarTab>;
  sidebarSearchQuery: string;
  setSidebarSearchQuery: Setter<string>;
  userId: string;
  setUserId: Setter<string>;
  deckId: string;
  setDeckId: Setter<string>;
  deckKey: string;
  setDeckKey: Setter<string>;
  collaborativeDeck: boolean;
  setCollaborativeDeck: Setter<boolean>;
  authorOnlyNotes: boolean;
  setAuthorOnlyNotes: Setter<boolean>;
  isOffline: boolean;
  setIsOffline: Setter<boolean>;
  shareModalOpen: boolean;
  setShareModalOpen: Setter<boolean>;
  commandMenuState: CommandMenuState;
  setCommandMenuState: Setter<CommandMenuState>;
} & UserSettings &
  DaemonStore;

type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type StoreWithoutFunctions = Omit<Store, FunctionPropertyNames<Store>>;

export type Setter<T> = (value: T | ((value: T) => T)) => void;
export const setter =
  <K extends keyof StoreWithoutFunctions>(set: (fn: (draft: Draft<Store>) => void) => void, key: K) =>
  (value: Store[K] | ((value: Store[K]) => Store[K])) => {
    if (typeof value === 'function') {
      set(state => {
        state[key] = value(state[key]);
      });
    } else {
      set(state => {
        state[key] = value;
      });
    }
  };

export const store = createVanilla<Store>()(
  persist(
    immer(set => ({
      /**
       * Map of note id to notes
       */
      notes: {},
      /**
       * Sets the notes
       */
      setNotes: setter(set, 'notes'),
      /**
       * If the note id exists, then update the note. Otherwise, insert it
       */
      upsertNote: (note: DecryptedNote) => {
        set(state => {
          if (state.notes[note.id]) {
            state.notes[note.id] = { ...state.notes[note.id], ...note };
          } else {
            const existingNote = Object.values(state.notes).find(n => caseInsensitiveStringEqual(n.title, note.title));
            if (existingNote) {
              // Update existing note
              state.notes[existingNote.id] = {
                ...state.notes[existingNote.id],
                ...note,
              };
            } else {
              // Insert new note
              state.notes[note.id] = note;
              insertTreeItem(state.noteTree, { id: note.id, children: [], collapsed: true }, null);
            }
          }
        });
      },
      /**
       * Update the given note
       */
      updateNote: (note: NoteUpdate) => {
        set(state => {
          if (state.notes[note.id]) {
            state.notes[note.id] = { ...state.notes[note.id], ...note };
          }
        });
      },
      /**
       * Delete the note with the given noteId
       */
      deleteNote: (noteId: string) => {
        set(state => {
          delete state.notes[noteId];
          const item = deleteTreeItem(state.noteTree, noteId);
          if (item && item.children.length > 0) {
            for (const child of item.children) {
              insertTreeItem(state.noteTree, child, null);
            }
          }
        });
      },
      /**
       * The notes that have their content visible, including the main note and the stacked notes
       */
      openNoteIds: [],
      /**
       * Replaces the open notes at the given index (0 by default)
       */
      setOpenNoteIds: (newOpenNoteIds: string[], index?: number) => {
        if (!index) {
          set(state => {
            state.openNoteIds = newOpenNoteIds;
          });
          return;
        }
        // Replace the notes after the current note with the new note
        set(state => {
          state.openNoteIds.splice(index, state.openNoteIds.length - index, ...newOpenNoteIds);
        });
      },
      /**
       * The latest active note
       */
      activeNoteId: '',
      setActiveNoteId: setter(set, 'activeNoteId'),
      /**
       * The tree of notes visible in the sidebar
       */
      noteTree: [],
      setNoteTree: setter(set, 'noteTree'),
      /**
       * Moves the tree item with the given noteId to the given newParentNoteId's children
       */
      moveNoteTreeItem: (noteId: string, newParentNoteId: string | null) => {
        // Don't do anything if the note ids are the same
        if (noteId === newParentNoteId) {
          return;
        }
        set(state => {
          const item = deleteTreeItem(state.noteTree, noteId);
          if (item) {
            insertTreeItem(state.noteTree, item, newParentNoteId);
          }
        });
      },
      /**
       * Expands or collapses the tree item with the given noteId
       */
      toggleNoteTreeItemCollapsed: (noteId: string) => {
        set(state => {
          toggleNoteTreeItemCollapsed(state.noteTree, noteId);
        });
      },
      /**
       * Cache of block id to backlinks
       */
      blockIdToBacklinksMap: {},
      setBlockIdToBacklinksMap: setter(set, 'blockIdToBacklinksMap'),
      sidebarTab: SidebarTab.Notes,
      setSidebarTab: setter(set, 'sidebarTab'),
      sidebarSearchQuery: '',
      setSidebarSearchQuery: setter(set, 'sidebarSearchQuery'),
      userId: '',
      setUserId: setter(set, 'userId'),
      deckId: '',
      setDeckId: setter(set, 'deckId'),
      deckKey: '',
      setDeckKey: setter(set, 'deckKey'),
      collaborativeDeck: false,
      setCollaborativeDeck: setter(set, 'collaborativeDeck'),
      authorOnlyNotes: false,
      setAuthorOnlyNotes: setter(set, 'authorOnlyNotes'),
      isOffline: false,
      setIsOffline: setter(set, 'isOffline'),
      shareModalOpen: false,
      setShareModalOpen: setter(set, 'shareModalOpen'),
      commandMenuState: { isVisible: false, editor: undefined },
      setCommandMenuState: setter(set, 'commandMenuState'),
      ...createUserSettingsSlice(set),
      ...createDaemonSlice(set),
    })),
    {
      name: 'dunlin-storage',
      version: 1,
      getStorage: () => storage,
      partialize: state => ({
        openNoteIds: state.openNoteIds,
        isSidebarOpen: state.isSidebarOpen,
        noteSort: state.noteSort,
        darkMode: state.darkMode,
        isPageStackingOn: state.isPageStackingOn,
        confirmNoteDeletion: state.confirmNoteDeletion,
        isDaemonUser: state.isDaemonUser,
        messages: state.messages,
        model: state.model,
        temperature: state.temperature,
      }),
    },
  ),
);

export const useStore = create(store);

/**
 * Deletes the tree item with the given id and returns it.
 */
const deleteTreeItem = (tree: NoteTreeItem[], id: string): NoteTreeItem | null => {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.id === id) {
      tree.splice(i, 1);
      return item;
    } else if (item.children.length > 0) {
      const result = deleteTreeItem(item.children, id);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

/**
 * Inserts the given item into the tree as a child of the item with targetId, and returns true if it was inserted.
 * If targetId is null, inserts the item into the root level.
 */
const insertTreeItem = (tree: NoteTreeItem[], item: NoteTreeItem, targetId: string | null): boolean => {
  if (targetId === null) {
    tree.push(item);
    return true;
  }

  for (let i = 0; i < tree.length; i++) {
    const treeItem = tree[i];
    if (treeItem.id === targetId) {
      tree[i].children.push(item);
      return true;
    } else if (treeItem.children.length > 0) {
      const result = insertTreeItem(treeItem.children, item, targetId);
      if (result) {
        return result;
      }
    }
  }
  return false;
};

/**
 * Expands or collapses the tree item with the given id, and returns true if it was updated.
 */
const toggleNoteTreeItemCollapsed = (tree: NoteTreeItem[], id: string): boolean => {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.id === id) {
      tree[i] = { ...item, collapsed: !item.collapsed };
      return true;
    } else if (item.children.length > 0) {
      const result = toggleNoteTreeItemCollapsed(item.children, id);
      if (result) {
        return result;
      }
    }
  }
  return false;
};

/**
 * Gets the note tree item corresponding to the given noteId.
 */
export const getNoteTreeItem = (tree: NoteTreeItem[], id: string): NoteTreeItem | null => {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.id === id) {
      return item;
    } else if (item.children.length > 0) {
      const result = getNoteTreeItem(item.children, id);
      if (result) {
        return result;
      }
    }
  }
  return null;
};
