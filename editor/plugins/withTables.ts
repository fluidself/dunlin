import { Editor, Range, Transforms } from 'slate';
import { ElementType } from 'types/slate';
import { deserialize } from './withHtml';

const isInTable = (editor: Editor) =>
  Editor.above(editor, {
    match: n => n.type === ElementType.Table,
  });

const withTables = (editor: Editor) => {
  const { insertData, insertText, deleteBackward, deleteForward } = editor;

  editor.insertData = (data: any) => {
    const html = data.getData('text/html');
    const isSlateFragment = data.types.includes('application/x-slate-fragment');

    if (isInTable(editor) && isSlateFragment && html) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  editor.insertText = (text: any) => {
    // Disallow pipe character to not disturb serialization to markdown
    if (isInTable(editor) && text === '|') {
      return;
    }

    insertText(text);
  };

  editor.deleteBackward = (...args: any[]) => {
    const { selection } = editor;
    const start = Editor.start(editor, selection);
    const isAtLineStart = Editor.isStart(editor, start, selection);
    const abovePath = Editor.before(editor, selection.anchor.path);

    if (!isInTable(editor) && abovePath && Editor.parent(editor, abovePath)[0].type === ElementType.TableCell && isAtLineStart) {
      return;
    }

    if (isInTable(editor) && selection && Range.isCollapsed(selection)) {
      const currentCell = Editor.above(editor, { match: n => n.type === ElementType.TableCell });

      if (currentCell && !Editor.string(editor, currentCell[1]) && isAtLineStart) {
        return;
      }
    }

    deleteBackward(...args);
  };

  editor.deleteForward = (...args: any[]) => {
    const { selection } = editor;
    const current = Editor.node(editor, selection);
    const currentEnd = Editor.end(editor, current[1]);
    const isAtLineEnd = Editor.isEnd(editor, currentEnd, selection);
    const belowPath = Editor.after(editor, selection.anchor.path);

    if (!isInTable(editor) && belowPath && Editor.parent(editor, belowPath)[0].type === ElementType.TableCell && isAtLineEnd) {
      return;
    }

    if (isInTable(editor) && selection && Range.isCollapsed(selection)) {
      const currentCell = Editor.above(editor, { match: n => n.type === ElementType.TableCell });

      if (currentCell) {
        const currentCellEnd = Editor.end(editor, currentCell[1]);
        const isAtCellLineEnd = Editor.isEnd(editor, currentCellEnd, selection);

        if (isAtCellLineEnd) {
          return;
        }
      }
    }

    deleteForward(...args);
  };

  return editor;
};

export default withTables;
