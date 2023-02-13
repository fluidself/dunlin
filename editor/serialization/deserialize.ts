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

import type { Descendant } from 'slate';
import { CodeLine, ElementType, Mark, TableCell, TableRow } from 'types/slate';
import { createNodeId } from 'editor/plugins/withNodeId';
import { createTableRowNode } from 'editor/plugins/withTables/lib';
import { MdastNode } from './types';

export type OptionType = Record<string, never>;

export default function deserialize(node: MdastNode, opts?: OptionType): Descendant {
  let children = [{ text: '' }];

  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    children = node.children.map((c: MdastNode) =>
      deserialize({ ...c, ordered: node.ordered || false, parentType: node.type }, opts),
    );
  }

  switch (node.type) {
    case 'heading':
      if (node.depth === 1) {
        return { id: createNodeId(), type: ElementType.HeadingOne, children };
      } else if (node.depth === 2) {
        return { id: createNodeId(), type: ElementType.HeadingTwo, children };
      } else {
        return { id: createNodeId(), type: ElementType.HeadingThree, children };
      }

    case 'list':
      return {
        id: createNodeId(),
        type: node.ordered ? ElementType.NumberedList : ElementType.BulletedList,
        children,
      };

    case 'listItem': {
      const checked = node.checked;
      if (typeof checked === 'boolean') {
        return {
          id: createNodeId(),
          type: ElementType.CheckListItem,
          checked,
          children,
        };
      } else {
        return { id: createNodeId(), type: ElementType.ListItem, children };
      }
    }

    case 'paragraph':
      return { id: createNodeId(), type: ElementType.Paragraph, children };

    case 'link':
      return {
        id: createNodeId(),
        type: ElementType.ExternalLink,
        url: node.url ?? '',
        children,
      };
    case 'wikiLink': {
      const noteTitle = node.value?.split('/').pop() ?? ''; // Handle pathnames by removing the last slash and everything before it
      // Note ids are omitted and are added later
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return {
        id: createNodeId(),
        type: ElementType.NoteLink,
        noteTitle,
        ...(node.data?.alias && node.data.alias !== node.value ? { customText: node.data.alias } : {}),
        children: [{ text: noteTitle }],
      };
    }

    case 'image':
      return {
        id: createNodeId(),
        type: ElementType.Image,
        children: [{ text: '' }],
        url: node.url ?? '',
        caption: node.alt,
      };
    case 'embed':
      return {
        id: createNodeId(),
        type: ElementType.Embed,
        children: [{ text: '' }],
        url: node.url ?? '',
        oembed: node.oembed,
      };

    case 'blockquote':
      return { id: createNodeId(), type: ElementType.Blockquote, children };
    case 'callout':
      const content = node.content?.length ? node.content : [{ type: 'paragraph', children: [{ text: '' }] }];
      return {
        id: createNodeId(),
        type: ElementType.Callout,
        calloutType: node.calloutType ?? 'note',
        title: node.title,
        content: content.map((c: MdastNode) => deserialize({ ...c }), opts),
        children,
      };

    case 'code':
      const codeLines: CodeLine[] =
        node.value?.split('\n').map(line => ({
          id: createNodeId(),
          type: ElementType.CodeLine,
          children: [{ text: line }],
        })) || [];
      return {
        id: createNodeId(),
        type: ElementType.CodeBlock,
        lang: node.lang ?? '',
        children: codeLines,
      };

    case 'detailsDisclosure':
      return {
        id: createNodeId(),
        type: ElementType.DetailsDisclosure,
        summaryText: node.detailsSummaryText ?? '',
        children,
      };

    case 'table':
      const rowNodes: TableRow[] = [];

      node.children?.forEach(tableRow => {
        const rowElement = createTableRowNode({ children: new Array(tableRow.children?.length ?? 0) });
        const cellNodes: TableCell[] = [];

        tableRow.children?.forEach(tableCell => {
          let tableCellChildren = [{ text: '' }];

          if (tableCell.children && Array.isArray(tableCell.children) && tableCell.children.length > 0) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            tableCellChildren = tableCell.children.map((c: MdastNode) =>
              deserialize({ ...c, ordered: tableCell.ordered || false, parentType: tableCell.type }, opts),
            );
          }

          const cell: TableCell = {
            id: createNodeId(),
            type: ElementType.TableCell,
            children: tableCellChildren,
          };
          cellNodes.push(cell);
        });

        rowElement.children = cellNodes;
        rowNodes.push(rowElement);
      });

      return {
        id: createNodeId(),
        type: ElementType.Table,
        header: ['first_row'],
        children: rowNodes,
      };

    case 'html':
      return { text: node.value?.replace(/<br>|<br\/>/g, '\n') || '' };

    case 'emphasis':
      return {
        [Mark.Italic]: true,
        ...forceLeafNode(children),
        ...persistLeafFormats(children),
      };
    case 'strong':
      return {
        [Mark.Bold]: true,
        ...forceLeafNode(children),
        ...persistLeafFormats(children),
      };
    case 'delete':
      return {
        [Mark.Strikethrough]: true,
        ...forceLeafNode(children),
        ...persistLeafFormats(children),
      };
    case 'inlineCode':
      return {
        [Mark.Code]: true,
        text: node.value ?? '',
        ...persistLeafFormats(children),
      };
    case 'superscript':
      return {
        [Mark.Superscript]: true,
        ...forceLeafNode(children),
        ...persistLeafFormats(children),
      };
    case 'subscript':
      return {
        [Mark.Subscript]: true,
        ...forceLeafNode(children),
        ...persistLeafFormats(children),
      };
    case 'thematicBreak':
      return {
        id: createNodeId(),
        type: ElementType.ThematicBreak,
        children: [{ text: '' }],
      };

    case 'text':
    default:
      return { text: node.value || '' };
  }
}

const forceLeafNode = (children: Array<{ text?: string }>) => ({
  text: children.map(k => k?.text).join(''),
});

// This function will take any unknown keys and bring them up a level,
// allowing leaf nodes to have many different formats at once,
// e.g. bold and italic on the same node
function persistLeafFormats(children: Array<MdastNode>) {
  return children.reduce((acc, node) => {
    Object.keys(node).forEach(function (key) {
      if (key === 'children' || key === 'type' || key === 'text') return;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = node[key];
    });

    return acc;
  }, {});
}
