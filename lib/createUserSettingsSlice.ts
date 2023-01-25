import { Draft } from 'immer';
import { setter, Setter, Store } from './store';

export enum Sort {
  TitleAscending = 'TITLE_ASCENDING',
  TitleDescending = 'TITLE_DESCENDING',
  DateModifiedDescending = 'DATE_MODIFIED_DESCENDING',
  DateModifiedAscending = 'DATE_MODIFIED_ASCENDING',
  DateCreatedDescending = 'DATE_CREATED_DESCENDING',
  DateCreatedAscending = 'DATE_CREATED_ASCENDING',
}

export const ReadableNameBySort = {
  [Sort.TitleAscending]: 'Title (A to Z)',
  [Sort.TitleDescending]: 'Title (Z to A)',
  [Sort.DateModifiedDescending]: 'Modified time (new to old)',
  [Sort.DateModifiedAscending]: 'Modified time (old to new)',
  [Sort.DateCreatedDescending]: 'Created time (new to old)',
  [Sort.DateCreatedAscending]: 'Created time (old to new)',
} as const;

export type UserSettings = {
  darkMode: boolean;
  setDarkMode: Setter<boolean>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: Setter<boolean>;
  isPageStackingOn: boolean;
  setIsPageStackingOn: Setter<boolean>;
  confirmNoteDeletion: boolean;
  setConfirmNoteDeletion: Setter<boolean>;
  noteSort: Sort;
  setNoteSort: Setter<Sort>;
};

const createUserSettingsSlice = (set: (fn: (draft: Draft<Store>) => void) => void) => ({
  darkMode: true,
  setDarkMode: setter(set, 'darkMode'),
  isSidebarOpen: true,
  setIsSidebarOpen: setter(set, 'isSidebarOpen'),
  isPageStackingOn: true,
  setIsPageStackingOn: setter(set, 'isPageStackingOn'),
  confirmNoteDeletion: true,
  setConfirmNoteDeletion: setter(set, 'confirmNoteDeletion'),
  noteSort: Sort.TitleAscending,
  setNoteSort: setter(set, 'noteSort'),
});

export default createUserSettingsSlice;
