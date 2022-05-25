// import type { Descendant } from 'slate';
import { NoteTreeItem } from 'lib/store';
import { AccessControlCondition, ResourceId } from './lit';

export type User = {
  id: string;
};

export type Deck = {
  id: string;
  user_id: User['id'];
  note_tree: NoteTreeItem[];
  // deck_name?: string;
  // access_params: AccessParams;
  details: {
    encrypted_string: string;
    encrypted_symmetric_key: string;
    access_control_conditions: AccessControlCondition[];
  };
};

export type Note = {
  id: string;
  deck_id: Deck['id'];
  // content: Descendant[];
  // title: string;
  content: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type EncryptedNoteEntry = {
  data: string;
  iv: string;
  salt: string;
};

export type AccessParams = {
  resource_id: ResourceId;
  access_control_conditions: AccessControlCondition[];
};
