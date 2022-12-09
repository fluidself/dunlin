import { Element, Node } from 'slate';
import { ReferenceableBlockElement, ElementType } from 'types/slate';

// Returns true if the element is of type ReferenceableBlockElement, false otherwise
export const isReferenceableBlockElement = (element: Element): element is ReferenceableBlockElement => {
  return (
    element.type === ElementType.Paragraph ||
    element.type === ElementType.HeadingOne ||
    element.type === ElementType.HeadingTwo ||
    element.type === ElementType.HeadingThree ||
    element.type === ElementType.ListItem ||
    element.type === ElementType.Blockquote ||
    element.type === ElementType.CodeBlock ||
    element.type === ElementType.ThematicBreak ||
    element.type === ElementType.Image ||
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

export function isTableNode(value: Node): value is ElementType.Table {
  return value.type === ElementType.Table;
}

export function isTableRowNode(value: Node): value is ElementType.TableRow {
  return value.type === ElementType.TableRow;
}

export function isTableCellNode(value: Node): value is ElementType.TableCell {
  return value.type === ElementType.TableCell;
}
