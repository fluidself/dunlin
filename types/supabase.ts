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
  view_only: boolean;
  created_at: string;
  updated_at: string;
};
