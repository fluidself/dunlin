import dynamic from 'next/dynamic';
import { RenderElementProps } from 'slate-react';
import { ElementType } from 'types/slate';
import Spinner from 'components/Spinner';
import ParagraphElement from './ParagraphElement';
import BlockRefElement from './BlockRefElement';
import ImageElement from './ImageElement';
import VideoElement from './VideoElement';
import EmbedElement from './EmbedElement';
import FileAttachmentElement from './file-attachment/FileAttachmentElement';
import ThematicBreakElement from './ThematicBreakElement';
import ExternalLinkElement from './ExternalLinkElement';
import NoteLinkElement from './NoteLinkElement';
import CheckListItemElement from './CheckListItemElement';
import TagElement from './TagElement';
import DetailsDisclosureElement from './DetailsDisclosureElement';
import CalloutElement from './callout/CalloutElement';
import TableElement from './table/TableElement';
import TableCellElement from './table/TableCellElement';
import CodeBlockElement from './CodeBlockElement';
const MermaidElement = dynamic(() => import('./MermaidElement'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <Spinner />
    </div>
  ),
});

export type EditorElementProps = {
  className?: string;
  attributes: { contentEditable?: boolean };
} & RenderElementProps;

export default function EditorElement(props: EditorElementProps) {
  const { className = '', attributes, children, element } = props;

  switch (element.type) {
    case ElementType.HeadingOne:
      return (
        <h1 className={`text-2xl font-semibold ${className}`} {...attributes}>
          {children}
        </h1>
      );
    case ElementType.HeadingTwo:
      return (
        <h2 className={`text-xl font-semibold ${className}`} {...attributes}>
          {children}
        </h2>
      );
    case ElementType.HeadingThree:
      return (
        <h3 className={`text-lg font-semibold ${className}`} {...attributes}>
          {children}
        </h3>
      );
    case ElementType.ListItem:
      return (
        <li className={className} {...attributes}>
          {children}
        </li>
      );
    case ElementType.BulletedList:
      return (
        <ul className={`ml-6 list-disc ${className}`} {...attributes}>
          {children}
        </ul>
      );
    case ElementType.NumberedList:
      return (
        <ol className={`ml-9 list-decimal ${className}`} {...attributes}>
          {children}
        </ol>
      );
    case ElementType.CheckListItem:
      return (
        <CheckListItemElement className={className} element={element} attributes={attributes}>
          {children}
        </CheckListItemElement>
      );
    case ElementType.Blockquote:
      return (
        <blockquote className={`pl-4 border-l-4 ${className}`} {...attributes}>
          {children}
        </blockquote>
      );
    case ElementType.Callout:
      return (
        <CalloutElement className={className} element={element} attributes={attributes}>
          {children}
        </CalloutElement>
      );
    case ElementType.CodeLine:
      return <div {...attributes}>{children}</div>;
    case ElementType.CodeBlock:
      return (
        <CodeBlockElement className={className} element={element} attributes={attributes}>
          {children}
        </CodeBlockElement>
      );
    case ElementType.MermaidDiagram:
      return (
        <MermaidElement className={className} element={element} attributes={attributes}>
          {children}
        </MermaidElement>
      );
    case ElementType.ThematicBreak:
      return (
        <ThematicBreakElement className={className} attributes={attributes}>
          {children}
        </ThematicBreakElement>
      );
    case ElementType.ExternalLink:
      return (
        <ExternalLinkElement className={className} element={element} attributes={attributes}>
          {children}
        </ExternalLinkElement>
      );
    case ElementType.NoteLink:
      return (
        <NoteLinkElement className={className} element={element} attributes={attributes}>
          {children}
        </NoteLinkElement>
      );
    case ElementType.Tag:
      return (
        <TagElement className={className} element={element} attributes={attributes}>
          {children}
        </TagElement>
      );
    case ElementType.Image:
      return (
        <ImageElement className={className} element={element} attributes={attributes}>
          {children}
        </ImageElement>
      );
    case ElementType.Video:
      return (
        <VideoElement className={className} element={element} attributes={attributes}>
          {children}
        </VideoElement>
      );
    case ElementType.Embed:
      return (
        <EmbedElement className={className} element={element} attributes={attributes}>
          {children}
        </EmbedElement>
      );
    case ElementType.FileAttachment:
      return (
        <FileAttachmentElement className={className} element={element} attributes={attributes}>
          {children}
        </FileAttachmentElement>
      );
    case ElementType.BlockReference:
      return (
        <BlockRefElement className={className} element={element} attributes={attributes}>
          {children}
        </BlockRefElement>
      );
    case ElementType.DetailsDisclosure:
      return (
        <DetailsDisclosureElement className={className} element={element} attributes={attributes}>
          {children}
        </DetailsDisclosureElement>
      );
    case ElementType.Table:
      return (
        <TableElement element={element} attributes={attributes}>
          {children}
        </TableElement>
      );
    case ElementType.TableRow: {
      return <tr {...attributes}>{children}</tr>;
    }
    case ElementType.TableCell: {
      return (
        <TableCellElement element={element} attributes={attributes}>
          {children}
        </TableCellElement>
      );
    }
    default:
      return (
        <ParagraphElement className={className} element={element} attributes={attributes}>
          {children}
        </ParagraphElement>
      );
  }
}
