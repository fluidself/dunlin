import { useMemo } from 'react';
import { createEditor, Descendant, Editor, Element, Node } from 'slate';
import { Callout, ElementType, Footnote } from 'types/slate';
import { useStore } from 'lib/store';

export default function WordCount() {
  const activeNoteId = useStore(state => state.activeNoteId);
  const note = useStore(state => state.notes[activeNoteId]);
  const content = useMemo(() => combinedContent(note?.content ?? []), [note?.content]);
  const wordCount = useMemo(
    () =>
      !content.length || (content.length === 1 && !Node.string(content[0]))
        ? 0
        : content.map(Node.string).join('\n').split(/\s+/).length,
    [content],
  );
  const characterCount = useMemo(() => content.map(Node.string).join('').length, [content]);

  return (
    <div className="flex absolute bottom-0 right-0 w-fit px-2 py-1 text-xs space-x-2 select-none rounded-tl z-50 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      <span>{wordCount} words</span>
      <span>{characterCount} characters</span>
    </div>
  );
}

const combinedContent = (content: Descendant[]) => {
  const contentEditor = createEditor();
  contentEditor.children = content;
  const footnoteAndCalloutContent = Array.from(
    Editor.nodes<Footnote | Callout>(contentEditor, {
      at: [],
      match: n => Element.isElement(n) && (n.type === ElementType.Footnote || n.type === ElementType.Callout),
    }),
  )
    .map(nodeEntry => nodeEntry[0])
    .map(node => (node.type === ElementType.Callout ? node.content : node.definition))
    .flat();
  return [...content, ...footnoteAndCalloutContent];
};
