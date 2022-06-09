import type { Descendant } from 'slate';
import { User } from 'types/supabase';
import { NoteTreeItem } from 'lib/store';

export type DecryptedDeck = {
  id: string;
  user_id: User['id'];
  note_tree: NoteTreeItem[];
  deck_name: string;
  key: string;
};

export type DecryptedNote = {
  id: string;
  deck_id: DecryptedDeck['id'];
  content: Descendant[];
  title: string;
  created_at: string;
  updated_at: string;
};