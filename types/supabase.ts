import type { Descendant } from 'slate';
import { NoteTreeItem } from 'lib/store';
import { AccessControlCondition } from './lit';

export type User = {
  id: string;
  note_tree: NoteTreeItem[];
  ipfs_hashes: IpfsHashes;
};

export type Note = {
  id: string;
  user_id: User['id'];
  content: Descendant[];
  title: string;
  created_at: string;
  updated_at: string;
};

export type IpfsHashes = {
  encryptedZipBase64?: string;
  hexEncryptedSymmetricKey?: string;
  accessControlConditions?: AccessControlCondition[];
};
