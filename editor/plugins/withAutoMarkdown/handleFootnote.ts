import { Editor, Point, Transforms } from 'slate';
import { getDefaultEditorValue } from 'editor/constants';
import { ElementType, Footnote } from 'types/slate';
import { createNodeId } from '../withNodeId';
import { deleteMarkup } from './handleInlineShortcuts';

export default function handleFootnote(
  editor: Editor,
  result: RegExpMatchArray,
  endOfMatchPoint: Point,
  textToInsertLength: number,
): boolean {
  const [, startMark, footnoteMarker, endMark] = result;

  const footnoteRange = deleteMarkup(editor, endOfMatchPoint, {
    startMark: startMark.length,
    text: footnoteMarker.length,
    endMark: endMark.length,
    textToInsert: textToInsertLength - 1,
  });

  const footnote: Footnote = {
    id: createNodeId(),
    type: ElementType.Footnote,
    definition: getDefaultEditorValue(),
    children: [{ text: '' }],
  };

  Transforms.wrapNodes(editor, footnote, { at: footnoteRange, split: true });

  return true;
}
