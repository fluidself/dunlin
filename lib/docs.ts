import fs from 'fs';
import { join } from 'path';

const docsDirectory = join(process.cwd(), 'docs');

export function getDocsSlugs() {
  return fs.readdirSync(docsDirectory);
}

export function getDocEntryBySlug(slug: string, fields = []) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(docsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  return { title: slug.toLocaleUpperCase(), content: fileContents };
}

export function getAllDocEntries() {
  const slugs = getDocsSlugs().map(slug => slug.replace(/\.md$/, ''));
  return slugs;
}
