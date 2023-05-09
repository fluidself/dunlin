import type { BaseEditor, Descendant } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { HistoryEditor } from 'slate-history';
import type { YjsEditor } from 'slate-yjs';
import type { OembedData } from '@extractus/oembed-extractor';
import type { TablesEditor } from 'editor/plugins/withTables';
import type { CalloutType } from 'components/editor/elements/callout/config';

export type DeckEditor = BaseEditor & ReactEditor & HistoryEditor & YjsEditor & TablesEditor;
export type SoloDeckEditor = BaseEditor & ReactEditor & HistoryEditor & TablesEditor;

export enum ElementType {
  Paragraph = 'paragraph',
  HeadingOne = 'heading-one',
  HeadingTwo = 'heading-two',
  HeadingThree = 'heading-three',
  ListItem = 'list-item',
  BulletedList = 'bulleted-list',
  NumberedList = 'numbered-list',
  CheckListItem = 'check-list-item',
  Blockquote = 'block-quote',
  Callout = 'callout',
  ExternalLink = 'link',
  NoteLink = 'note-link',
  Footnote = 'footnote',
  Tag = 'tag',
  CodeLine = 'code-line',
  CodeBlock = 'code-block',
  MermaidDiagram = 'mermaid-diagram',
  ThematicBreak = 'thematic-break',
  Image = 'image',
  Video = 'video',
  Embed = 'embed',
  FileAttachment = 'file-attachment',
  BlockReference = 'block-reference',
  DetailsDisclosure = 'details-disclosure',
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell',
}

export enum Mark {
  Bold = 'bold',
  Italic = 'italic',
  Code = 'code',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Highlight = 'highlight',
  Superscript = 'superscript',
  Subscript = 'subscript',
  Select = 'select',
}

export type ParagraphElement = {
  id: string;
  type: ElementType.Paragraph;
  children: Descendant[];
};

export type HeadingOneElement = {
  id: string;
  type: ElementType.HeadingOne;
  children: Descendant[];
};

export type HeadingTwoElement = {
  id: string;
  type: ElementType.HeadingTwo;
  children: Descendant[];
};

export type HeadingThreeElement = {
  id: string;
  type: ElementType.HeadingThree;
  children: Descendant[];
};

export type ListItem = {
  id: string;
  type: ElementType.ListItem;
  children: Descendant[];
};

export type BulletedList = {
  id: string;
  type: ElementType.BulletedList;
  children: Descendant[];
};

export type NumberedList = {
  id: string;
  type: ElementType.NumberedList;
  children: Descendant[];
};

export type CheckListItem = {
  id: string;
  type: ElementType.CheckListItem;
  checked: boolean;
  children: Descendant[];
};

export type Blockquote = {
  id: string;
  type: ElementType.Blockquote;
  children: Descendant[];
};

export type Callout = {
  id: string;
  type: ElementType.Callout;
  calloutType: CalloutType;
  title?: string;
  content: Descendant[];
  children: Descendant[];
};

export type ExternalLink = {
  id: string;
  type: ElementType.ExternalLink;
  url: string;
  children: Descendant[];
};

export type NoteLink = {
  id: string;
  type: ElementType.NoteLink;
  noteId: string;
  noteTitle: string;
  customText?: string;
  children: Descendant[];
};

export type Footnote = {
  id: string;
  type: ElementType.Footnote;
  definition: Descendant[];
  children: Descendant[];
};

export type Tag = {
  id: string;
  type: ElementType.Tag;
  name: string; // Name does not have #
  children: Descendant[]; // Children has the #
};

export type CodeLine = {
  id: string;
  type: ElementType.CodeLine;
  children: Descendant[];
};

export type CodeBlock = {
  id: string;
  type: ElementType.CodeBlock;
  lang?: string;
  children: CodeLine[];
};

export type MermaidDiagram = {
  id: string;
  type: ElementType.MermaidDiagram;
  definition: string;
  children: Descendant[];
};

export type ThematicBreak = {
  id: string;
  type: ElementType.ThematicBreak;
  children: Descendant[];
};

export type UploadedFile = {
  cid: string;
  symmKey: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type FileAttachment = {
  id: string;
  type: ElementType.FileAttachment;
  file: UploadedFile;
  description?: string;
  children: Descendant[];
};

export type Image = {
  id: string;
  type: ElementType.Image;
  url: string;
  caption?: string;
  children: Descendant[];
};

export type Video = {
  id: string;
  type: ElementType.Video;
  url: string;
  children: Descendant[];
};

export type Embed = {
  id: string;
  type: ElementType.Embed;
  url: string;
  oembed?: OembedData;
  children: Descendant[];
};

export type BlockReference = {
  id: string;
  type: ElementType.BlockReference;
  blockId: string;
  children: Descendant[];
};

export type DetailsDisclosure = {
  id: string;
  type: ElementType.DetailsDisclosure;
  summaryText: string;
  children: Descendant[];
};

export type TableHeader = 'first_row' | 'first_column';

export type Table = {
  id: string;
  type: ElementType.Table;
  children: TableRow[];
  border?: boolean;
  header?: TableHeader[];
};

export type TableRow = {
  id: string;
  type: ElementType.TableRow;
  children: TableCell[];
};

export type TableCell = {
  id: string;
  type: ElementType.TableCell;
  children: Descendant[];
  rowspan?: number;
  colspan?: number;
};

export type ReferenceableBlockElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | ListItem
  | CheckListItem
  | Blockquote
  | Callout
  | CodeLine
  | CodeBlock
  | MermaidDiagram
  | ThematicBreak
  | Image
  | Video
  | Embed
  | FileAttachment
  | BlockReference
  | DetailsDisclosure
  | Table;

export type InlineElement = ExternalLink | NoteLink | Tag | Footnote | TableRow | TableCell;

export type ListElement = BulletedList | NumberedList;

export type DeckElement = ReferenceableBlockElement | ListElement | InlineElement;

export type FormattedText = { text: string } & Partial<Record<Mark, boolean>>;

export type DeckText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: DeckEditor | SoloDeckEditor;
    Element: DeckElement;
    Text: DeckText;
  }
}
