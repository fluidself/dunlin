import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Node, Parent, Literal } from 'unist';

// Remark plugin to convert <sup></sup> and <sub></sub> HTML nodes to superscript and subscript Mdast nodes
const supersub: Plugin = function () {
  return function (tree) {
    // Superscript
    let superscriptIndex: number | null = null;
    visit(tree, (node: Node, index, parent: Parent<Node>) => {
      if (node.type !== 'html') return;

      const { value } = node as Literal<string>;

      if (value === '<sup>') {
        superscriptIndex = index;
      } else if (value === '</sup>' && index && typeof superscriptIndex === 'number') {
        const textChild = parent.children[index - 1];
        const superscriptNode = {
          type: 'superscript',
          data: {
            hName: 'sup',
          },
          children: [textChild],
        };
        parent.children.splice(superscriptIndex, 3, superscriptNode);
        superscriptIndex = null;
      }
    });

    // Subscript
    let subscriptIndex: number | null = null;
    visit(tree, (node: Node, index, parent: Parent<Node>) => {
      if (node.type !== 'html') return;

      const { value } = node as Literal<string>;

      if (value === '<sub>') {
        subscriptIndex = index;
      } else if (value === '</sub>' && index && typeof subscriptIndex === 'number') {
        const textChild = parent.children[index - 1];
        const subscriptNode = {
          type: 'subscript',
          data: {
            hName: 'sub',
          },
          children: [textChild],
        };
        parent.children.splice(subscriptIndex, 3, subscriptNode);
        subscriptIndex = null;
      }
    });
  };
};

export default supersub;
