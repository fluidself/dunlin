import fs from 'fs';
import { join } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const docsDirectory = join(process.cwd(), 'docs');

export function getDocsSlugs() {
  return fs.readdirSync(docsDirectory);
}

export function getDocEntryBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(docsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  return { content: fileContents };
}

export function getAllDocEntries() {
  const slugs = getDocsSlugs().map(slug => slug.replace(/\.md$/, ''));
  return slugs;
}

export async function parseMarkdownBody(body: string) {
  const parsedBody = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(wikiLinkPlugin, { aliasDivider: '|' })
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(body);

  return String(parsedBody);
}
