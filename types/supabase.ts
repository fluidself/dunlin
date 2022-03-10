import type { Descendant } from 'slate';
import { NoteTreeItem } from 'lib/store';

export type User = {
  id: string;
  note_tree: NoteTreeItem[];
};

export type Note = {
  id: string;
  user_id: User['id'];
  content: Descendant[];
  title: string;
  created_at: string;
  updated_at: string;
};
