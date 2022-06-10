import { Editor, Path, Transforms, Range } from 'slate';
import { ElementType } from 'types/slate';
import { createContent } from 'components/editor/elements/table/creator';

const withTables = (editor: Editor) => {
  const { addMark, removeMark, deleteBackward, deleteFragment } = editor;

  editor.addMark = (key: any, value: any) => {
    if (editor.selection) {
      const lastSelection = editor.selection;

      const selectedCells = Editor.nodes(editor, {
        match: n => n.selectedCell,
        at: [],
      });

      let isTable = false;

      for (let cell of selectedCells) {
        if (!isTable) {
          isTable = true;
        }

        const [content] = Editor.nodes(editor, {
          match: n => n.type === ElementType.TableContent,
          at: cell[1],
        });

        if (Editor.string(editor, content[1]) !== '') {
          Transforms.setSelection(editor, Editor.range(editor, cell[1]));
          addMark(key, value);
        }
      }

      if (isTable) {
        Transforms.select(editor, lastSelection);
        return;
      }
    }

    addMark(key, value);
  };

  editor.removeMark = (key: any) => {
    if (editor.selection) {
      const lastSelection = editor.selection;
      const selectedCells = Editor.nodes(editor, {
        match: n => {
          return n.selectedCell;
        },
        at: [],
      });

      let isTable = false;
      for (let cell of selectedCells) {
        if (!isTable) {
          isTable = true;
        }

        const [content] = Editor.nodes(editor, {
          match: n => n.type === ElementType.TableContent,
          at: cell[1],
        });

        if (Editor.string(editor, content[1]) !== '') {
          Transforms.setSelection(editor, Editor.range(editor, cell[1]));
          removeMark(key);
        }
      }

      if (isTable) {
        Transforms.select(editor, lastSelection);
        return;
      }
    }
    removeMark(key);
  };

  editor.deleteFragment = (...args: any[]) => {
    if (editor.selection && isInSameTable(editor)) {
      const selectedCells = Editor.nodes(editor, {
        match: n => {
          return n.selectedCell;
        },
      });

      for (let cell of selectedCells) {
        Transforms.setSelection(editor, Editor.range(editor, cell[1]));

        const [content] = Editor.nodes(editor, {
          match: n => n.type === ElementType.TableContent,
        });

        Transforms.insertNodes(editor, createContent(), { at: content[1] });
        Transforms.removeNodes(editor, { at: Path.next(content[1]) });
      }

      return;
    }

    Transforms.removeNodes(editor, {
      match: n => n.type === ElementType.Table,
    });

    deleteFragment(...args);
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

function isInSameTable(editor: Editor): boolean {
  if (!editor.selection) return false;

  const [start, end] = Editor.edges(editor, editor.selection);
  const [startTable] = Editor.nodes(editor, {
    at: start,
    match: n => n.type === ElementType.Table,
  });

  const [endTable] = Editor.nodes(editor, {
    at: end,
    match: n => n.type === ElementType.Table,
  });

  if (startTable && endTable) {
    const [, startPath]: [any, Path] = startTable;
    const [, endPath]: [any, Path] = endTable;

    if (Path.equals(startPath, endPath)) {
      return true;
    }
  }

  return false;
}

export default withTables;
