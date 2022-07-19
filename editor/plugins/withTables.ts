import { Editor, Range, Transforms } from 'slate';
import { ElementType } from 'types/slate';
import { deserialize } from './withHtml';

const withTables = (editor: Editor) => {
  const { insertData, deleteBackward } = editor;

  editor.insertData = (data: any) => {
    const html = data.getData('text/html');
    const isSlateFragment = data.types.includes('application/x-slate-fragment');
    const isInTable = Editor.above(editor, {
      match: n => n.type === ElementType.Table,
    });

    if (isInTable && isSlateFragment && html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  editor.deleteBackward = (...args: any[]) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const isInTable = Editor.above(editor, {
        match: n => n.type === ElementType.Table,
      });

      if (isInTable) {
        const start = Editor.start(editor, selection);
        const isStart = Editor.isStart(editor, start, selection);

        const currCell = Editor.above(editor, {
          match: n => n.type === ElementType.TableCell,
        });

        if (isStart && currCell && !Editor.string(editor, currCell[1])) {
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
};

export default withTables;
