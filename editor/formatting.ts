import { Editor, Element, Transforms, Range, Text, Node, Path } from 'slate';
import _isEqual from 'lodash/isEqual';
import detectIndent from 'detect-indent';
import { store } from 'lib/store';
import type { ExternalLink, NoteLink, ListElement, Image, BlockReference, Tag, DetailsDisclosure, CodeBlock } from 'types/slate';
import { ElementType, Mark } from 'types/slate';
import { computeBlockReference } from './backlinks/useBlockReference';
import { createNodeId } from './plugins/withNodeId';
import { isTextType } from './checks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMark = (type: any): type is Mark => {
  return Object.values(Mark).includes(type as Mark);
};

export const isListType = (type: ElementType): type is ElementType.BulletedList | ElementType.NumberedList => {
  return type === ElementType.BulletedList || type === ElementType.NumberedList;
};

export const isMarkActive = (editor: Editor, format: Mark) => {
  const [match] = Editor.nodes(editor, {
    match: n => Text.isText(n) && n[format] === true,
    mode: 'all',
  });
  return !!match;
};

export const toggleMark = (editor: Editor, format: Mark) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isElementActive = (editor: Editor, format: ElementType, path?: Path) => {
  const [match] = Editor.nodes(editor, {
    ...(path ? { at: path } : {}),
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === format,
  });

  return !!match;
};

export const toggleElement = (editor: Editor, format: ElementType, path?: Path) => {
  const pathRef = path ? Editor.pathRef(editor, path) : null;
  const isActive = isElementActive(editor, format, path);
  const inTable = Editor.above(editor, { match: n => n.type === ElementType.Table });

  if (inTable) {
    return;
  }

  // Returns the current path
  const getCurrentLocation = () => pathRef?.current ?? undefined;

  // If we're switching to a text type element that's not currently active,
  // then we want to fully unwrap the list.
  const continueUnwrappingList = () => {
    // format is text type and is not currently active
    const formatIsTextAndNotActive = !isActive && isTextType(format);

    // there is a list element above the current path/selection
    const hasListTypeAbove = Editor.above(editor, {
      at: getCurrentLocation(),
      match: n => !Editor.isEditor(n) && Element.isElement(n) && isListType(n['type']),
    });

    return formatIsTextAndNotActive && hasListTypeAbove;
  };

  do {
    Transforms.unwrapNodes(editor, {
      at: getCurrentLocation(),
      match: n => !Editor.isEditor(n) && Element.isElement(n) && isListType(n['type']),
      split: true,
    });
  } while (continueUnwrappingList());

  Transforms.unwrapNodes(editor, {
    at: getCurrentLocation(),
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n['type'] === ElementType.CodeBlock,
    split: true,
  });

  let newProperties: Partial<Element>;
  if (isActive) {
    newProperties = { type: ElementType.Paragraph };
  } else if (isListType(format)) {
    newProperties = { type: ElementType.ListItem };
  } else if (format === ElementType.CheckListItem) {
    newProperties = { type: ElementType.CheckListItem, checked: false };
  } else {
    newProperties = { type: format };
  }
  Transforms.setNodes(editor, newProperties, { at: getCurrentLocation() });

  if (!isActive && isListType(format)) {
    const block: ListElement = {
      id: createNodeId(),
      type: format,
      children: [],
    };
    Transforms.wrapNodes(editor, block, { at: getCurrentLocation() });
  }
  if (!isActive && format === ElementType.CodeLine) {
    const block: CodeBlock = {
      id: createNodeId(),
      type: ElementType.CodeBlock,
      children: [],
    };
    Transforms.wrapNodes(editor, block, { at: getCurrentLocation() });
  }
};

export const DEFAULT_INDENTATION = '  ';

export const getIndent = (text: string, defaultValue: string = ''): string => {
  return detectIndent(text).indent || defaultValue;
};

export const handleIndent = (editor: Editor) => {
  if (isElementActive(editor, ElementType.BulletedList)) {
    Transforms.wrapNodes(editor, {
      id: createNodeId(),
      type: ElementType.BulletedList,
      children: [],
    });
  } else if (isElementActive(editor, ElementType.NumberedList)) {
    Transforms.wrapNodes(editor, {
      id: createNodeId(),
      type: ElementType.NumberedList,
      children: [],
    });
  } else if (isElementActive(editor, ElementType.CodeLine)) {
    handleTableIndentation(editor, IndentationType.Indent);
  }
};

export const handleUnindent = (editor: Editor) => {
  const { selection } = editor;
  if (!selection) return;

  if (isElementActive(editor, ElementType.CodeLine)) {
    handleTableIndentation(editor, IndentationType.Unindent);
  }

  const ancestors = Node.ancestors(editor, selection.anchor.path);
  let numOfLists = 0;
  for (const [ancestorNode] of ancestors) {
    if (Element.isElement(ancestorNode) && isListType(ancestorNode.type)) {
      numOfLists++;
    }
  }

  // Only unindent if there would be another list above the current node
  if (numOfLists > 1) {
    Transforms.unwrapNodes(editor, {
      match: n => !Editor.isEditor(n) && Element.isElement(n) && isListType(n['type']),
      split: true,
    });
  }
};

enum IndentationType {
  'Indent',
  'Unindent',
}

const handleTableIndentation = (editor: Editor, type: IndentationType) => {
  const codeLines = Editor.nodes(editor, {
    match: n => n.type === ElementType.CodeLine,
  });

  for (const codeLine of codeLines) {
    const [codeLineNode, codeLinePath] = codeLine;
    const codeLineStart = Editor.start(editor, codeLinePath);
    const lineString = Node.string(codeLineNode);
    const indent = getIndent(lineString);
    const indentMatch = indent.match(new RegExp(DEFAULT_INDENTATION, 'g'))?.length || 0;
    const rest = indent.slice(DEFAULT_INDENTATION.length * indentMatch).length;

    if (type === IndentationType.Indent) {
      const indentToInsert = rest
        ? DEFAULT_INDENTATION.slice(DEFAULT_INDENTATION.length - DEFAULT_INDENTATION.length / 2)
        : DEFAULT_INDENTATION;
      const insertLocation = editor.selection && Range.isCollapsed(editor.selection) ? editor.selection : codeLineStart;

      Transforms.insertText(editor, indentToInsert, { at: insertLocation });
    } else if (type === IndentationType.Unindent) {
      if (indentMatch || rest) {
        Transforms.delete(editor, {
          at: codeLineStart,
          distance: rest ? rest : DEFAULT_INDENTATION.length,
        });
      }
    }
  }
};

export const handleExitBreak = (editor: Editor) => {
  // Exit code block into an empty paragraph block
  if (isElementActive(editor, ElementType.CodeBlock)) {
    if (!editor.selection) return;
    const selectionPath = Editor.path(editor, editor.selection);
    const insertPath = Path.next(selectionPath.slice(0, 1));
    Transforms.insertNodes(
      editor,
      {
        id: createNodeId(),
        type: ElementType.Paragraph,
        children: [{ text: '' }],
      },
      { at: insertPath, select: true },
    );
  } else {
    editor.insertBreak();
  }
};

export const removeLink = (editor: Editor) => {
  unwrapLink(editor);
  Transforms.collapse(editor, { edge: 'end' });
};

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      (n['type'] === ElementType.ExternalLink || n['type'] === ElementType.NoteLink),
    voids: true,
  });
};

const wrapLink = (editor: Editor, link: ExternalLink | NoteLink) => {
  const { selection } = editor;
  if (!selection) {
    return;
  }

  if (isElementActive(editor, ElementType.ExternalLink) || isElementActive(editor, ElementType.NoteLink)) {
    unwrapLink(editor);
  }

  const shouldInsertNode = selection && Range.isCollapsed(selection);
  if (shouldInsertNode) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

// Text is only used as the link text if the range is collapsed; otherwise, we reuse the existing selection text.
export const insertExternalLink = (editor: Editor, url: string, text?: string) => {
  const { selection } = editor;
  if (!selection) {
    return;
  }

  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: ExternalLink = {
    id: createNodeId(),
    type: ElementType.ExternalLink,
    url,
    children: isCollapsed ? [{ text: text ?? url }] : [],
  };
  wrapLink(editor, link);
};

export const insertNoteLink = (editor: Editor, noteId: string, noteTitle: string) => {
  const { selection } = editor;
  if (!selection) {
    return;
  }

  const isCollapsed = selection && Range.isCollapsed(selection);
  const link: NoteLink = {
    id: createNodeId(),
    type: ElementType.NoteLink,
    noteId,
    noteTitle,
    customText: !isCollapsed ? Editor.string(editor, selection) : undefined,
    children: isCollapsed ? [{ text: noteTitle }] : [],
  };
  wrapLink(editor, link);
};

export const insertTag = (editor: Editor, name: string) => {
  const tag: Tag = {
    id: createNodeId(),
    type: ElementType.Tag,
    name: name,
    children: [{ text: `#${name}` }],
  };
  Transforms.insertNodes(editor, tag);
};

export const insertImage = (editor: Editor, url: string, path?: Path) => {
  const image: Image = {
    id: createNodeId(),
    type: ElementType.Image,
    url,
    children: [{ text: '' }],
  };

  if (path) {
    // Set the node at the given path to be an image
    Transforms.setNodes(editor, image, { at: path });
  } else {
    // Insert a new image node
    Transforms.insertNodes(editor, image);
  }
};

export const insertBlockReference = (editor: Editor, blockId: string, onOwnLine: boolean) => {
  if (!editor.selection) {
    return;
  }

  const blockReference = computeBlockReference(store.getState().notes, blockId);
  const blockText = blockReference ? Node.string(blockReference.element) : '';

  const blockRef: BlockReference = {
    id: createNodeId(),
    type: ElementType.BlockReference,
    blockId,
    children: [{ text: blockText }],
  };

  if (onOwnLine) {
    // The block ref is on its own line
    Transforms.setNodes(editor, blockRef);
    Transforms.insertText(editor, blockText, {
      at: editor.selection.anchor.path,
      voids: true,
    }); // Children are not set with setNodes, so we need to insert the text manually
  } else {
    // There's other content on the same line
    Editor.insertNode(editor, blockRef);
  }
  // This fixes a bug where you can't change your selection after adding a block ref
  Transforms.setSelection(editor, {
    anchor: { ...editor.selection.anchor, offset: 0 },
    focus: { ...editor.selection.focus, offset: 0 },
  });
};

export const insertDetailsDisclosure = (editor: Editor, path?: Path) => {
  const details: DetailsDisclosure = {
    id: createNodeId(),
    type: ElementType.DetailsDisclosure,
    summaryText: '',
    children: [{ text: '' }],
  };
  const documentEnd = Editor.end(editor, []);

  if (path) {
    // Set the node at the given path to be a details disclosure node
    Transforms.setNodes(editor, details, { at: path });
  } else {
    // Insert a new details disclosure node
    Transforms.insertNodes(editor, details);
  }

  // Insert new paragraph after the node if it's at end of document
  if (path && path[0] === documentEnd.path[0]) {
    Transforms.insertNodes(
      editor,
      {
        id: createNodeId(),
        type: ElementType.Paragraph,
        children: [{ text: '' }],
      },
      { at: documentEnd },
    );
  }
};

export const BRACKET_MAP: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

export const handleBrackets = (editor: Editor, openingBracket: string) => {
  const closingBracket: string = BRACKET_MAP[openingBracket];

  const block = Editor.above(editor, { match: n => Editor.isBlock(editor, n) });
  if (!block) return editor.insertText(openingBracket);

  const [lineElement] = block;
  const lineString = Node.string(lineElement);
  const nextCharacter = lineString[editor.selection.anchor.offset] ?? null;

  if (!nextCharacter || nextCharacter.match(/\s|\)|\]|}/)) {
    editor.insertText(openingBracket);
    Transforms.insertText(editor, closingBracket);
    Transforms.move(editor, { unit: 'offset', reverse: true });
  } else {
    editor.insertText(openingBracket);
  }
};
