import { Editor, Element, Node, Transforms } from 'slate';
import { CodeBlock, CodeLine, ElementType, FormattedText } from 'types/slate';
import { createNodeId } from './withNodeId';
import { deserialize } from './withHtml';

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
      Transforms.insertFragment(editor, transformedFragment);
      return;
    }

    insertFragment(fragment);
  };

  editor.insertData = (data: any) => {
    const html = data.getData('text/html');
    const isSlateFragment = data.types.includes('application/x-slate-fragment');
    const inCodeLine = Editor.above(editor, {
      match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeLine,
    });

    if (inCodeLine && html && !isSlateFragment) {
      try {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const fragment = deserialize(parsed.body);
        const transformedFragment = [];

        for (const node of fragment) {
          if (node.text) {
            transformedFragment.push(deserializeCodeLine(node.text));
          } else if (node.text === '') {
            continue;
          } else {
            transformedFragment.push(node);
          }
        }

        Transforms.insertFragment(editor, transformedFragment);
        return;
      } catch (error) {
        insertData(data);
      }
    }

    insertData(data);
  };

  return editor;
};

function deserializeCodeLine(line: string): CodeLine {
  return {
    id: createNodeId(),
    type: ElementType.CodeLine,
    children: [{ text: line }],
  };
}

export default withCodeBlocks;
