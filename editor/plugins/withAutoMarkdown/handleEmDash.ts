import { Editor, Point, Transforms } from 'slate';
import { deleteText } from 'editor/transforms';

export default function handleEmDash(editor: Editor, endOfMatchPoint: Point): boolean {
  const pointPath = endOfMatchPoint.path;
  const pointOffset = endOfMatchPoint.offset;
  deleteText(editor, pointPath, pointOffset, 1); // delete preceding hyphen
  Transforms.insertText(editor, '—'); // Insert an em dash

  return true;
}
