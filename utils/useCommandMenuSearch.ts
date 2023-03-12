import { useCallback } from 'react';
import Fuse from 'fuse.js';
import { Notes, store } from 'lib/store';
import { allElementOptions, OptionType } from 'components/command-menu/CommandMenuSearch';

type FuseDatum = {
  id: string;
  title: string;
  type: OptionType;
};

type CommandMenuSearchOptions = {
  numOfResults?: number;
  withEditorElements: boolean;
};

export default function useCommandMenuSearch({ numOfResults = -1, withEditorElements }: CommandMenuSearchOptions) {
  const search = useCallback(
    (searchText: string) => {
      const fuse = initFuse(store.getState().notes, withEditorElements);
      return fuse.search(searchText, { limit: numOfResults });
    },
    [numOfResults],
  );
  return search;
}

const initFuse = (notes: Notes, withEditorElements: boolean) => {
  const fuseData = getFuseData(notes, withEditorElements);
  const keys = ['title'];
  return new Fuse<FuseDatum>(fuseData, {
    keys,
    ignoreLocation: true,
    threshold: 0.1,
  });
};

const getFuseData = (notes: Notes, withEditorElements: boolean): FuseDatum[] => {
  const noteData = Object.values(notes).map(
    (note): FuseDatum => ({
      id: note.id,
      title: note.title,
      type: OptionType.NOTE,
    }),
  );
  const elementData = withEditorElements
    ? allElementOptions
        .map(c => ({ id: c.id, title: c.text }))
        .map(
          (component): FuseDatum => ({
            id: component.id,
            title: component.title,
            type: OptionType.ELEMENT,
          }),
        )
    : [];

  return [...noteData, ...elementData];
};
