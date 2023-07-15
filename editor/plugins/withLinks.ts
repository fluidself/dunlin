import { Editor, Range, Transforms } from 'slate';
import { isUrl } from 'utils/url';
import { insertExternalLink } from 'editor/formatting';
import { ElementType } from 'types/slate';

const withLinks = (editor: Editor) => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element: any) => {
    return element.type === ElementType.ExternalLink || element.type === ElementType.NoteLink
      ? true
      : isInline(element);
  };

  editor.insertText = (text: any) => {
    const { selection } = editor;

    if (text && isUrl(text)) {
      insertExternalLink(editor, text);
      Transforms.move(editor, { distance: 1, unit: 'offset' });
    } else if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const start = Editor.start(editor, anchor.path);
      const range = { anchor, focus: start };
      const beforeText = Editor.string(editor, range);
      const beforeTextArr = beforeText.split(' ');
      const lastSegment = beforeTextArr[beforeTextArr.length - 1];

      // If the last text segment is a URL, convert it into a link
      if (lastSegment && isUrl(lastSegment)) {
        const lastSegmentRange = {
          anchor,
          focus: {
            path: anchor.path,
            offset: anchor.offset - lastSegment.length,
          },
        };
        Transforms.select(editor, lastSegmentRange);
        insertExternalLink(editor, lastSegment);
        Transforms.move(editor, { distance: 1, unit: 'offset' });
      }

      insertText(text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      insertExternalLink(editor, text);
      Transforms.move(editor, { distance: 1, unit: 'offset' });
    } else {
      insertData(data);
    }
  };

  return editor;
};

export default withLinks;
