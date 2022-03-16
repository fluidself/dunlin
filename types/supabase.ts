import type { Descendant } from 'slate';
import { NoteTreeItem } from 'lib/store';
import { AccessControlCondition, ResourceId } from './lit';

export type User = {
  id: string;
  note_tree: NoteTreeItem[];
  access_params: AccessParams;
};

export type Note = {
  id: string;
  user_id: User['id'];
  content: Descendant[];
  title: string;
  created_at: string;
  updated_at: string;
};

export type AccessParams = {
  resource_id: ResourceId;
  access_control_conditions: AccessControlCondition[];
};
