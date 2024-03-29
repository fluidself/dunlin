import { Editor, Element, Location, Node, Transforms } from 'slate';
import type { KeyboardEvent } from 'react';
import { isHotkey } from 'is-hotkey';
import { CodeBlock, CodeLine, ElementType, FormattedText } from 'types/slate';
import { getIndent } from 'editor/formatting';
import { createNodeId } from './withNodeId';

const withCodeBlocks = (editor: Editor) => {
  const { insertData, insertFragment, normalizeNode } = editor;

  editor.normalizeNode = (entry: any) => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === ElementType.CodeBlock) {
      for (const [child, childPath] of Node.children(editor, path)) {
        // Children of code block should all be code lines
        if (Element.isElement(child) && child.type !== ElementType.CodeLine) {
          Transforms.setNodes(editor, { type: ElementType.CodeLine }, { at: childPath });
          return;
        }
        // Convert any pure text children to correct code line structure
        else if (!Element.isElement(child) && (child as FormattedText).text) {
          const codeLines = (child as FormattedText).text.split('\n').map(deserializeCodeLine);
          // Create updated code block with code line children
          const nodeToInsert: CodeBlock = {
            id: createNodeId(),
            type: ElementType.CodeBlock,
            lang: node.lang ?? '',
            children: codeLines,
          };

          // Replace block
          Editor.withoutNormalizing(editor, () => {
            Transforms.removeNodes(editor, { at: path });
            Transforms.insertNodes(editor, nodeToInsert, { at: path });
          });

          return;
        }
      }
    }

    normalizeNode(entry);
  };

  editor.insertFragment = (fragment: any) => {
    const inCodeLine = Editor.above(editor, {
      match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeLine,
    });

    if (inCodeLine) {
      const transformedFragment = fragment.flatMap((node: any) =>
        node.type === ElementType.CodeBlock
          ? node.children.map((child: CodeLine) => ({ ...child, id: createNodeId() }))
          : deserializeCodeLine(Node.string(node)),
      );
      return insertFragment(transformedFragment);
    }

    insertFragment(fragment);
  };

  editor.insertData = (data: any) => {
    const text = data.getData('text/plain');
    const isSlateFragment = data.types.includes('application/x-slate-fragment');
    const inCodeLine = Editor.above(editor, {
      match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeLine,
    });

    if (inCodeLine && !isSlateFragment) {
      try {
        const fragment = text?.split('\n').map((l: string) => deserializeCodeLine(l));
        return insertFragment(fragment);
      } catch (error) {
        insertData(data);
      }
    }

    insertData(data);
  };

  return editor;
};

export function deserializeCodeLine(line: string): CodeLine {
  return {
    id: createNodeId(),
    type: ElementType.CodeLine,
    children: [{ text: line }],
  };
}

export function onKeyDown(event: KeyboardEvent<HTMLDivElement>, editor: Editor) {
  if (!editor.selection) return;

  let locationToSelect: Location | undefined = undefined;

  if (isHotkey('mod+a', event)) {
    const codeBlock = Editor.above(editor, { match: n => n.type === ElementType.CodeBlock });
    if (!codeBlock) return;
    const [, codeBlockPath] = codeBlock;
    locationToSelect = codeBlockPath;
  }

  if (isHotkey(['mod+left', 'mod+shift+left'], event)) {
    const codeLine = Editor.above(editor, { match: n => n.type === ElementType.CodeLine });
    if (!codeLine) return;
    const lineString = Node.string(codeLine[0]);
    const indent = getIndent(lineString);
    const anchorOffset = editor.selection.anchor.offset > indent.length ? indent.length : 0;
    const focusOffset = isHotkey('mod+shift+left', event) ? editor.selection.focus.offset : anchorOffset;
    locationToSelect = {
      anchor: { ...editor.selection.anchor, offset: anchorOffset },
      focus: {
        ...editor.selection.focus,
        offset: focusOffset,
      },
    };
  }

  if (locationToSelect) {
    event.stopPropagation();
    event.preventDefault();
    Transforms.select(editor, locationToSelect);
  }
}

export default withCodeBlocks;
