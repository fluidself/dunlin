import type { Editor } from 'slate';

let activeEditors: Record<string, Editor> = {};

export const activeEditorsStore = {
  getActiveEditor(id: string) {
    return activeEditors[id];
  },
  addActiveEditor(id: string, editor: Editor) {
    if (activeEditors[id]) {
      return;
    }
    activeEditors = { ...activeEditors, [id]: editor };
  },
  removeActiveEditor(id: string) {
    const newEditors = { ...activeEditors };
    delete newEditors[id];
    activeEditors = newEditors;
  },
};

export default activeEditorsStore;
