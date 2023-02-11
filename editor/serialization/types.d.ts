import type { CalloutType } from 'components/editor/elements/callout/config';

export interface MdastNode {
  type?: string;
  ordered?: boolean;
  value?: string;
  text?: string;
  children?: Array<MdastNode>;
  depth?: 1 | 2 | 3 | 4 | 5 | 6;
  url?: string;
  alt?: string;
  lang?: string;
  data?: {
    alias?: string;
  };
  parentType?: string; // custom attribute specifying the parent type
  // mdast metadata
  position?: unknown;
  spread?: unknown;
  checked?: unknown;
  indent?: unknown;
  detailsSummaryText?: string;
  calloutType?: CalloutType;
  title?: string;
  content?: MdastNode[];
  oembed?: { type: 'rich' | 'video'; html: string; version: string };
}
