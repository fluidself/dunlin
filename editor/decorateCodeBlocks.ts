import { Editor, BaseRange, NodeEntry, Node } from 'slate';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-mermaid';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import { ElementType } from 'types/slate';

Prism.manual = true;

export default function decorateCodeBlocks(editor: Editor, [node, path]: NodeEntry) {
  const ranges: BaseRange[] = [];

  if (node === editor || node.type !== ElementType.CodeLine) return ranges;

  const [parentNode] = Editor.parent(editor, path);
  if (!parentNode || parentNode.type !== ElementType.CodeBlock) return ranges;

  const blockLanguage = parentNode.lang;
  if (!blockLanguage || !Object.keys(CODE_BLOCK_LANGUAGES).includes(blockLanguage)) return ranges;

  try {
    const tokens = Prism.tokenize(Node.string(node), Prism.languages[blockLanguage]);
    let start = 0;

    for (const token of tokens) {
      const length = getLength(token);
      const end = start + length;

      if (typeof token !== 'string') {
        ranges.push({
          [token.type === 'text' ? 'string' : token.type]: true,
          anchor: { path, offset: start },
          focus: { path, offset: end },
        });
      }
      start = end;
    }

    return ranges;
  } catch (error) {
    console.error(error);
    return ranges;
  }
}

const getLength = (token: string | Prism.Token): number => {
  if (typeof token === 'string') {
    return token.length;
  } else if (typeof token.content === 'string') {
    return token.content.length;
  } else {
    return (token.content as (string | Prism.Token)[]).reduce((l, t) => l + getLength(t), 0);
  }
};

export const CODE_BLOCK_LANGUAGES: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  graphql: 'GraphQL',
  html: 'HTML',
  javascript: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  mermaid: 'Mermaid',
  python: 'Python',
  solidity: 'Solidity',
  sql: 'SQL',
  typescript: 'TypeScript',
};

export const LANGUAGE_CLASSES = Object.keys(CODE_BLOCK_LANGUAGES).map(lang => `language-${lang}`);
export const TOKEN_CLASSES = [
  'annotation',
  'arrow',
  'assign-left',
  'atom-input',
  'atrule',
  'attr-name',
  'attr-value',
  'bold',
  'boolean',
  'builtin',
  'cdata',
  'char',
  'class-name',
  'comment',
  'constant',
  'decorator',
  'definition-mutation',
  'definition-query',
  'deleted',
  'directive',
  'doctype',
  'entity',
  'environment',
  'file-descriptor',
  'for-or-select',
  'fragment',
  'function',
  'function-name',
  'function-variable',
  'generic-function',
  'hashbang',
  'identifier',
  'important',
  'inserted',
  'inter-arrow-label',
  'italic',
  'keyword',
  'label',
  'language-regex',
  'literal-property',
  'namespace',
  'null',
  'number',
  'object',
  'operator',
  'parameter',
  'prolog',
  'property',
  'property-query',
  'punctuation',
  'regex',
  'regex-delimiter',
  'regex-flags',
  'regex-source',
  'scalar',
  'selector',
  'shebang',
  'special-attr',
  'string',
  'string-interpolation',
  'string-property',
  'style',
  'symbol',
  'tag',
  'template-string',
  'text',
  'token',
  'triple-quoted-string',
  'url',
  'variable',
  'version',
];
