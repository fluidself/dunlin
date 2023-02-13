/*
The following was modified from the source code of remark-slate.

License (MIT)
WWWWWW||WWWWWW
 W W W||W W W
      ||
    ( OO )__________
     /  |           \
    /o o|    MIT     \
    \___/||_||__||_|| *
         || ||  || ||
        _||_|| _||_||
       (__|__|(__|__|
Copyright © 2020-present Jack Hanford, jackhanford@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import type { RichTypeData, VideoTypeData } from '@extractus/oembed-extractor';
import { Element, Text } from 'slate';
import {
  BlockReference,
  Callout,
  CheckListItem,
  CodeBlock,
  DetailsDisclosure,
  ElementType,
  Embed,
  ExternalLink,
  FormattedText,
  Image,
  MermaidDiagram,
  NoteLink,
  Tag,
  Video,
} from 'types/slate';
import { isVoid } from 'editor/plugins/withVoidElements';
import { computeBlockReference } from 'editor/backlinks/useBlockReference';
import { store } from 'lib/store';
import { isListType } from 'editor/formatting';
import { getImageElementUrl } from 'components/editor/elements/ImageElement';

type LeafType = FormattedText & { parentType?: ElementType };

type BlockType = Element & { parentType?: ElementType };

export type SerializeOptions = {
  listDepth?: number;
  forPublication: boolean;
  publishLinkedNotes: boolean;
};

const isLeafNode = (node: BlockType | LeafType): node is LeafType => {
  return Text.isText(node);
};

const BREAK_TAG = '';

export default function serialize(
  chunk: BlockType | LeafType,
  opts: SerializeOptions = { forPublication: false, publishLinkedNotes: false },
): string | undefined {
  const { listDepth = 0 } = opts;
  const text: string = (chunk as LeafType).text || '';
  const type: ElementType = (chunk as BlockType).type || '';

  let children = text;

  if (!isLeafNode(chunk)) {
    children = chunk.children
      .map((c: BlockType | LeafType) => {
        return serialize(
          { ...c, parentType: type },
          {
            // track depth of nested lists so we can add proper spacing
            listDepth: isListType((c as BlockType).type || '') ? listDepth + 1 : listDepth,
            ...opts,
          },
        );
      })
      .join('');
  }

  // Keep empty paragraphs and void elements, but strip out other empty elements
  if (
    children === '' &&
    type !== ElementType.Paragraph &&
    type !== ElementType.TableCell &&
    !isLeafNode(chunk) &&
    !isVoid(chunk)
  ) {
    return;
  }

  // Never allow decorating break tags with rich text formatting,
  // this can malform generated markdown
  // Also ensure we're only ever applying text formatting to leaf node
  // level chunks, otherwise we can end up in a situation where
  // we try applying formatting like to a node like this:
  // "Text foo bar **baz**" resulting in "**Text foo bar **baz****"
  // which is invalid markup and can mess everything up
  if (children !== BREAK_TAG && isLeafNode(chunk)) {
    if (chunk.strikethrough && chunk.bold && chunk.italic) {
      children = retainWhitespaceAndFormat(children, '~~***');
    } else if (chunk.bold && chunk.italic) {
      children = retainWhitespaceAndFormat(children, '***');
    } else {
      if (chunk.bold) {
        children = retainWhitespaceAndFormat(children, '**');
      }

      if (chunk.italic) {
        children = retainWhitespaceAndFormat(children, '_');
      }

      if (chunk.strikethrough) {
        children = retainWhitespaceAndFormat(children, '~~');
      }

      if (chunk.code) {
        children = retainWhitespaceAndFormat(children, '`');
      }

      if (chunk.underline) {
        children = retainWhitespaceAndFormat(children, '<u>');
      }

      if (chunk.highlight) {
        children = retainWhitespaceAndFormat(children, '<mark>');
      }

      if (chunk.superscript) {
        children = retainWhitespaceAndFormat(children, '<sup>');
      }

      if (chunk.subscript) {
        children = retainWhitespaceAndFormat(children, '<sub>');
      }
    }
  }

  switch (type) {
    case ElementType.HeadingOne:
      return `# ${children}\n`;
    case ElementType.HeadingTwo:
      return `## ${children}\n`;
    case ElementType.HeadingThree:
      return `### ${children}\n`;

    case ElementType.Blockquote:
      // For some reason, marked is parsing blockquotes w/ one new line
      // as contiued blockquotes, so adding two new lines ensures that doesn't
      // happen
      return `> ${children}\n\n`;

    case ElementType.Callout:
      const callout = chunk as Callout;
      const formattedContent = callout.content
        .map(n => serialize(n, opts))
        .join('')
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
      return `> [!${callout.calloutType}] ${callout.title ?? ''}\n${formattedContent}\n\n`;

    case ElementType.CodeLine:
      return `${children}\n`;
    case ElementType.CodeBlock:
      const codeBlock = chunk as CodeBlock;
      return `\`\`\`${codeBlock.lang ?? ''}\n${children}\`\`\`\n`;
    case ElementType.MermaidDiagram:
      const mermaidDiagram = chunk as MermaidDiagram;
      return `\`\`\`mermaid\n${mermaidDiagram.definition}\n\`\`\`\n`;

    case ElementType.NoteLink: {
      const noteLink = chunk as NoteLink;
      if (!noteLink.noteTitle) {
        return '';
      } else if (opts.forPublication && opts.publishLinkedNotes) {
        return `[${noteLink.customText || noteLink.noteTitle}](${noteLink.noteId})`;
      } else if (opts.forPublication && !opts.publishLinkedNotes) {
        return `${noteLink.customText || noteLink.noteTitle}`;
      } else {
        return noteLink.customText ? `[[${noteLink.noteTitle}|${noteLink.customText}]]` : `[[${noteLink.noteTitle}]]`;
      }
    }
    case ElementType.ExternalLink:
      return `[${children}](${(chunk as ExternalLink).url})`;
    case ElementType.Tag:
      return `#${(chunk as Tag).name}`;

    case ElementType.Image: {
      const image = chunk as Image;
      const imageUrl = getImageElementUrl(image.url);
      return `![${image.caption ?? imageUrl}](${imageUrl})\n\n`;
    }
    case ElementType.Video: {
      const video = chunk as Video;
      const videoId = new URL(video.url).pathname.split('/').pop();
      const imageUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      return `[![${videoUrl}](${imageUrl})](${videoUrl} "${videoUrl}")\n\n`;
    }
    case ElementType.Embed: {
      const embed = chunk as Embed;
      const oembedData = embed.oembed ? (embed.oembed as RichTypeData | VideoTypeData) : null;
      return oembedData
        ? `${oembedData.html}\n`
        : `<iframe src="${embed.url}" width="640" height="360" title="${embed.url}"></iframe>\n`;
    }

    case ElementType.BulletedList:
    case ElementType.NumberedList: {
      const newLine = chunk.parentType && isListType(chunk.parentType) ? '' : '\n';
      return `${children}${newLine}`;
    }

    case ElementType.ListItem: {
      const isNumberedList = chunk && chunk.parentType === ElementType.NumberedList;

      let spacer = '';
      for (let k = 0; listDepth > k; k++) {
        spacer += '   ';
      }
      return `${spacer}${isNumberedList ? '1.' : '-'} ${children}\n`;
    }

    case ElementType.CheckListItem: {
      const checklistItem = chunk as CheckListItem;
      const check = checklistItem.checked ? 'x' : ' ';
      return `- [${check}] ${children}\n\n`;
    }

    case ElementType.Paragraph:
      return `${children}\n\n`;

    case ElementType.ThematicBreak:
      return `---\n\n`;

    case ElementType.BlockReference: {
      const blockRef = chunk as BlockReference;
      const reference = computeBlockReference(store.getState().notes, blockRef.blockId);
      if (reference) {
        return serialize(reference.element);
      } else {
        return children;
      }
    }

    case ElementType.DetailsDisclosure: {
      const detailsDisclosure = chunk as DetailsDisclosure;
      return `<details><summary>${detailsDisclosure.summaryText}</summary>\n\n${children}\n\n</details>\n\n`;
    }

    case ElementType.TableCell: {
      return `| ${children} `;
    }
    case ElementType.TableRow: {
      return `${children}|\n`;
    }
    case ElementType.Table: {
      const tableRows = children.split('\n').slice(0, -1);
      const [headerRow, ...rest] = tableRows;
      const columnCount = (headerRow.match(/\|/g)?.length ?? 1) - 1;
      const alignmentRow = '| :--- '.repeat(columnCount) + '|';

      return `${headerRow}\n${alignmentRow}\n${[...rest].join('\n')}\n\n`;
    }

    default:
      return children;
  }
}

// This function handles the case of a string like this: "   foo   "
// Where it would be invalid markdown to generate this: "**   foo   **"
// We instead, want to trim the whitespace out, apply formatting, and then
// bring the whitespace back. So our returned string looks like this: "   **foo**   "
function retainWhitespaceAndFormat(string: string, format: string) {
  // we keep this for a comparison later
  const frozenString = string.trim();

  // children will be mutated
  const children = frozenString;

  // We reverse the right side formatting, to properly handle bold/italic and strikethrough
  // formats, so we can create ~~***FooBar***~~
  const fullFormat = `${format}${children}${getEndFormat(format)}`;

  // This conditions accounts for no whitespace in our string
  // if we don't have any, we can return early.
  if (children.length === string.length) {
    return fullFormat;
  }

  // if we do have whitespace, let's add our formatting around our trimmed string
  // We reverse the right side formatting, to properly handle bold/italic and strikethrough
  // formats, so we can create ~~***FooBar***~~
  const formattedString = format + children + getEndFormat(format);

  // and replace the non-whitespace content of the string
  return string.replace(frozenString, formattedString);
}

const getEndFormat = (format: string) => {
  if (format.startsWith('<')) {
    return format.substring(0, 1) + '/' + format.substring(1);
  } else {
    return format.split('').reverse().join('');
  }
};
