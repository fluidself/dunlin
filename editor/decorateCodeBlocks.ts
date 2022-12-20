import { Text, Editor, BaseRange, NodeEntry } from 'slate';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-wasm';
import 'prismjs/themes/prism-tomorrow.css';
import { ElementType } from 'types/slate';

Prism.manual = true;

export const CODE_BLOCK_LANGUAGES: Record<string, string> = {
  bash: 'Bash',
  css: 'CSS',
  graphql: 'GraphQL',
  html: 'HTML',
  javascript: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  python: 'Python',
  solidity: 'Solidity',
  sql: 'SQL',
  typescript: 'TypeScript',
  wasm: 'WebAssembly',
};

export default function decorateCodeBlocks(editor: Editor, [node, path]: NodeEntry) {
  const ranges: BaseRange[] = [];

  if (node === editor) return ranges;

  const [parentNode] = Editor.parent(editor, path);
  if (!parentNode || parentNode.type !== ElementType.CodeBlock) return ranges;

  if (!Text.isText(node)) return ranges;

  const blockLanguage = parentNode.lang;
  if (!blockLanguage) return ranges;

  const tokens = Prism.tokenize(node.text, Prism.languages[blockLanguage]);
  let start = 0;

  for (const token of tokens) {
    const length = getLength(token);
    const end = start + length;

    if (typeof token !== 'string') {
      ranges.push({
        [token.type]: true,
        anchor: { path, offset: start },
        focus: { path, offset: end },
      });
    }

    start = end;
  }

  return ranges;
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
