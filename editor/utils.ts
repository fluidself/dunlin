import type { Descendant } from 'slate';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkToSlate from 'editor/serialization/remarkToSlate';
import remarkSupersub from 'lib/remark-supersub';

export function stringToSlate(input: string) {
  const { result } = unified()
    .use(remarkParse)
    .use(remarkSupersub)
    .use(remarkGfm)
    .use(wikiLinkPlugin, { aliasDivider: '|' })
    .use(remarkToSlate)
    .processSync(input);

  return result as Descendant[];
}
