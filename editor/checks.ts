import { Element, Node } from 'slate';
import { ReferenceableBlockElement, ElementType, Table, TableRow, TableCell } from 'types/slate';

export const isReferenceableBlockElement = (element: Element): element is ReferenceableBlockElement => {
  return (
    element.type === ElementType.Paragraph ||
    element.type === ElementType.HeadingOne ||
    element.type === ElementType.HeadingTwo ||
    element.type === ElementType.HeadingThree ||
    element.type === ElementType.ListItem ||
    element.type === ElementType.Blockquote ||
    element.type === ElementType.Callout ||
    element.type === ElementType.CodeBlock ||
    element.type === ElementType.MermaidDiagram ||
    element.type === ElementType.ThematicBreak ||
    element.type === ElementType.Image ||
    element.type === ElementType.Video ||
    element.type === ElementType.Embed ||
    element.type === ElementType.FileAttachment ||
    element.type === ElementType.Whiteboard ||
    element.type === ElementType.Table ||
    element.type === ElementType.BlockReference ||
    element.type === ElementType.CheckListItem ||
    element.type === ElementType.DetailsDisclosure
  );
};

export const isTextType = (
  type: ElementType,
): type is ElementType.Paragraph | ElementType.HeadingOne | ElementType.HeadingTwo | ElementType.HeadingThree => {
  return (
    type === ElementType.Paragraph ||
    type === ElementType.HeadingOne ||
    type === ElementType.HeadingTwo ||
    type === ElementType.HeadingThree
  );
};

export function isTableNode(value: Node): value is Table {
  return value.type === ElementType.Table;
}

export function isTableRowNode(value: Node): value is TableRow {
  return value.type === ElementType.TableRow;
}

export function isTableCellNode(value: Node): value is TableCell {
  return value.type === ElementType.TableCell;
}
