import { RenderLeafProps } from 'slate-react';
import Caret from './Caret';

export type EditorLeafProps = {
  attributes: { contentEditable?: boolean };
  leaf: { isCaret?: boolean; isForward?: boolean; data?: { alphaColor: string; color: string; name: string } };
} & RenderLeafProps;

const EditorLeaf = ({ attributes, children, leaf }: EditorLeafProps) => {
  const { isCaret, isForward, data, ...rest } = leaf;

  if (leaf.bold) {
    children = <b className="font-semibold">{children}</b>;
  }

  if (leaf.code) {
    children = (
      <code className="p-0.25 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">
        {children}
      </code>
    );
  }

  if (leaf.italic) {
    children = <em className="italic">{children}</em>;
  }

  if (leaf.underline) {
    children = <u className="underline">{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s className="line-through">{children}</s>;
  }

  if (leaf.highlight) {
    children = <mark className="bg-yellow-200 dark:bg-[#828324] dark:text-white">{children}</mark>;
  }

  if (leaf.select) {
    children = <mark className="py-[3px] bg-primary-500 text-gray-100">{children}</mark>;
  }

  if (leaf.superscript) {
    children = <sup className="align-super">{children}</sup>;
  }

  if (leaf.subscript) {
    children = <sub className="align-sub">{children}</sub>;
  }

  const nonTextAttributes = Object.keys(rest).filter(attr => attr !== 'text');
  const tokenClassName = nonTextAttributes.length ? `token ${nonTextAttributes.join(' ')}` : '';

  return (
    <span className={tokenClassName} {...attributes}>
      {isCaret ? (
        <span className={`relative bg-[${data?.alphaColor}]`}>
          <Caret isForward={isForward} data={leaf.data} />
        </span>
      ) : null}
      {children}
    </span>
  );
};

export default EditorLeaf;
