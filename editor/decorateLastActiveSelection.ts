import { Editor, BaseRange, NodeEntry, Range, Text } from 'slate';

export default function decorateLastActiveSelection(
  editor: Editor,
  [node, path]: NodeEntry,
  lastActiveSelection?: BaseRange,
) {
  if (node === editor || !Text.isText(node) || !lastActiveSelection) return [];
  const intersection = Range.intersection(lastActiveSelection, Editor.range(editor, path));
  if (!intersection) return [];

  const range = {
    select: true,
    ...intersection,
  };

  return [range];
}
