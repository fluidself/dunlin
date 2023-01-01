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
        // Ensure backwards compatibility by converting obsolete pure text code blocks to current structure
        else if (!Element.isElement(child) && (child as FormattedText).text) {
          // Convert text to code lines
          const codeLines = deserializeCode((child as FormattedText).text.split('\n'));
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
          : { id: createNodeId(), type: ElementType.CodeLine, children: [{ text: Node.string(node) }] },
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
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const fragment = deserialize(parsed.body);
      const text = fragment.map(t => t.text).filter(t => !!t);
      const fragmentToInsert = deserializeCode(text);
      Transforms.insertFragment(editor, fragmentToInsert);
      return;
    }

    insertData(data);
  };

  return editor;
};

function deserializeCode(lines: string[]): CodeLine[] {
  return lines.map(line => ({
    id: createNodeId(),
    type: ElementType.CodeLine,
    children: [{ text: line }],
  }));
}

export default withCodeBlocks;
