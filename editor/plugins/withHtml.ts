import { Editor, Element, Node } from 'slate';
import { jsx } from 'slate-hyperscript';
import { ElementType, Mark, TableCell, TableRow } from 'types/slate';
import { PickPartial } from 'types/utils';
import { isTextType } from 'editor/checks';
import { stringToSlate } from 'editor/utils';

const ELEMENT_TAGS: Record<string, (el: HTMLElement) => PickPartial<Element, 'id' | 'children'>> = {
  A: (el: HTMLElement) => ({
    type: ElementType.ExternalLink,
    url: el.getAttribute('href') ?? '',
  }),
  BLOCKQUOTE: () => ({ type: ElementType.Blockquote }),
  H1: () => ({ type: ElementType.HeadingOne }),
  H2: () => ({ type: ElementType.HeadingTwo }),
  H3: () => ({ type: ElementType.HeadingThree }),
  H4: () => ({ type: ElementType.HeadingThree }),
  H5: () => ({ type: ElementType.HeadingThree }),
  H6: () => ({ type: ElementType.HeadingThree }),
  IMG: (el: HTMLElement) => ({
    type: ElementType.Image,
    url: el.getAttribute('src') ?? '',
    caption: el.getAttribute('alt') ?? undefined,
  }),
  LI: () => ({ type: ElementType.Paragraph }),
  // OL: () => ({ type: ElementType.NumberedList }),
  P: () => ({ type: ElementType.Paragraph }),
  PRE: () => ({ type: ElementType.CodeBlock }),
  // UL: () => ({ type: ElementType.BulletedList }),
  TABLE: () => ({ type: ElementType.Table }),
  TR: () => ({ type: ElementType.TableRow }),
  TD: () => ({ type: ElementType.TableCell }),
  TH: () => ({ type: ElementType.TableCell }),
};

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
const TEXT_TAGS: Record<string, (el: HTMLElement) => Partial<Record<Mark, boolean>>> = {
  CODE: () => ({ [Mark.Code]: true }),
  DEL: () => ({ [Mark.Strikethrough]: true }),
  EM: () => ({ [Mark.Italic]: true }),
  I: () => ({ [Mark.Italic]: true }),
  S: () => ({ [Mark.Strikethrough]: true }),
  STRONG: () => ({ [Mark.Bold]: true }),
  U: () => ({ [Mark.Underline]: true }),
  MARK: () => ({ [Mark.Highlight]: true }),
  SUP: () => ({ [Mark.Superscript]: true }),
  SUB: () => ({ [Mark.Subscript]: true }),
};

export const deserialize = (el: HTMLElement): Node[] => {
  if (el.nodeType === 3) {
    // Keep the text content if there is actually content, or if it doesn't include \n
    // This will preserve whitespace around inlines and strip out extraneous newlines
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return el.textContent && (!el.textContent.includes('\n') || el.textContent.trim()) ? el.textContent : null;
  } else if (el.nodeType !== 1 || el.nodeName === 'BR' || el.nodeName === 'STYLE') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return null;
  }

  const { nodeName } = el;
  let parent = el;

  if (nodeName === 'PRE' && el.childNodes[0] && el.childNodes[0].nodeName === 'CODE') {
    parent = el.childNodes[0] as HTMLElement;
  }

  let children = Array.from(parent.childNodes as NodeListOf<HTMLElement>)
    .map(deserialize)
    .filter(Boolean)
    .flat();

  if (children.length === 0) {
    children = [{ text: '' }];
  }

  if (el.nodeName === 'BODY') {
    return jsx('fragment', {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return jsx('element', attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map(child => jsx('text', attrs, child));
  }

  return children;
};

const withHtml = (editor: Editor) => {
  const { insertData, insertFragment } = editor;

  editor.insertData = (data: any) => {
    const html = data.getData('text/html');
    const dataIsSlateFragment = data.types.includes('application/x-slate-fragment');

    // Only insert HTML if it doesn't come from a Slate editor.
    // We assume that if it comes from a Slate editor, then it's from our own,
    // so we want to preserve the original copy and paste behavior.
    // We can't currently differentiate between different editors; see https://github.com/ianstormtaylor/slate/issues/1024
    if (html && !dataIsSlateFragment) {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body).map(normalizeTable);
      return insertFragment(fragment);
    }

    const text = data.getData('text/plain');
    const slateContent = stringToSlate(text);

    // If we successfully parsed inserted data as editor elements, insert them.
    // Else, fall back to the original `insertData`.
    if (slateContent && slateContent.length && !dataIsSlateFragment) {
      return insertFragment(slateContent);
    }

    insertData(data);
  };

  return editor;
};

const normalizeTable = (node: Node) => {
  if (node.type !== ElementType.Table) return node;

  return {
    ...node,
    children: node.children
      // All table children should be table rows
      .filter((c: Node) => c.type && c.type === ElementType.TableRow)
      .map((row: TableRow) => ({
        ...row,
        children: row.children
          // All table row children should be table cells
          .filter((c: Node) => c.type && c.type === ElementType.TableCell)
          // Table cells should not have text type children
          .map((cell: TableCell) => ({
            ...cell,
            children: cell.children.map((c: Node) =>
              typeof c.type !== 'undefined' && isTextType(c.type) ? { text: Node.string(c).trim() } : c,
            ),
          })),
      })),
  };
};

export default withHtml;
