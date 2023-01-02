import { Editor, Point, Transforms } from 'slate';
import { ElementType, ExternalLink } from 'types/slate';
import { isUrl } from 'utils/url';
import { createNodeId } from '../withNodeId';
import { deleteMarkup } from './handleInlineShortcuts';

export default function handleExternalLink(
  editor: Editor,
  result: RegExpMatchArray,
  endOfMatchPoint: Point,
  textToInsertLength: number,
): boolean {
  const [, startMark, linkText, middleMark, linkUrl, endMark] = result;

  if (!isUrl(linkUrl)) {
    return false;
  }

  const linkTextRange = deleteMarkup(editor, endOfMatchPoint, {
    startMark: startMark.length,
    text: linkText.length,
    endMark: middleMark.length + linkUrl.length + endMark.length + 1,
    textToInsert: textToInsertLength,
  });
  const link: ExternalLink = {
    id: createNodeId(),
    type: ElementType.ExternalLink,
    url: linkUrl,
    children: [],
  };
  Transforms.wrapNodes(editor, link, {
    at: linkTextRange,
    split: true,
  });
  Transforms.move(editor, { unit: 'offset' });
  Transforms.insertText(editor, ' '); // Insert the trigger character (a space)

  return true;
}
