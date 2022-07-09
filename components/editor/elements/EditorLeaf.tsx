import React from 'react';
import { RenderLeafProps } from 'slate-react';
import Caret from './Caret';

export type EditorLeafProps = {
  attributes: { contentEditable?: boolean };
  leaf: { isCaret?: boolean; data?: { alphaColor: string; color: string; name: string } };
} & RenderLeafProps;

const EditorLeaf = ({ attributes, children, leaf }: EditorLeafProps) => {
  if (leaf.bold) {
    children = <b className="font-semibold">{children}</b>;
  }

  if (leaf.code) {
    children = (
      <code className="p-0.25 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">{children}</code>
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
    children = <mark className="bg-yellow-100 dark:bg-yellow-900 dark:text-white">{children}</mark>;
  }

  const data = leaf.data;

  return (
    <span {...attributes}>
      {leaf.isCaret ? (
        <span
          style={
            {
              position: 'relative',
              backgroundColor: data?.alphaColor,
            } as React.CSSProperties
          }
        >
          {<Caret {...(leaf as any)} />}
        </span>
      ) : null}
      {children}
    </span>
  );
};

export default EditorLeaf;
