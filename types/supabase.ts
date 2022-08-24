import { NoteTreeItem } from 'lib/store';
import { AccessControlCondition, BooleanCondition } from './lit';

export type User = {
  id: string;
};

export type Deck = {
  id: string;
  user_id: User['id'];
  note_tree: NoteTreeItem[];
  deck_name: string;
  author_only_notes: boolean;
  author_control_notes: boolean;
  access_params: {
    encrypted_string: string;
    encrypted_symmetric_key: string;
    access_control_conditions: (AccessControlCondition | BooleanCondition)[];
  };
};

export type Note = {
  id: string;
  deck_id: Deck['id'];
  user_id: User['id'];
  content: string;
  title: string;
  author_only: boolean;
  created_at: string;
  updated_at: string;
};

export type Contributor = {
  deck_id: Deck['id'];
  user_id: User['id'];
};
