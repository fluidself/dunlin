import { calloutTypeFromKeyword, calloutTypes, escapeRegExp } from 'lib/remark-callouts';
import { MdastNode } from './types';

/**
 * This plugin normalizes the MdastNode format to conform to app's slate schema.
 */
export default function normalize(node: MdastNode): MdastNode {
  return normalizeCallouts(
    normalizeEmbeds(
      normalizeDetailsDisclosure(normalizeImages(normalizeFootnotes(normalizeCheckListItems(normalizeLists(node))))),
    ),
  );
}

/**
 * This function:
 * 1. Lifts nested lists up one level
 * 2. Strips out paragraphs from list items, lifting the list item children up one level
 */
const normalizeLists = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  if (node.type !== 'list') {
    return { ...node, children: node.children.map(normalizeLists) };
  }

  const newChildren = [];

  // Iterate through the children (list items) of the list
  for (const child of node.children) {
    const normalizedChild = normalizeLists(child); // Normalize child

    if (!normalizedChild.children) {
      // No children, just push in normally
      newChildren.push(normalizedChild);
      continue;
    }

    // Iterate through the children of the list item
    if (normalizedChild.type === 'listItem') {
      const nestedLists = [];
      const newNestedChildren = [];
      for (const nestedChild of normalizedChild.children) {
        if (!nestedChild.children) {
          // No children, just push in normally
          newNestedChildren.push(nestedChild);
          continue;
        }

        if (nestedChild.type === 'list') {
          // If the list item child is a list, add it to nestedLists
          nestedLists.push(nestedChild);
        } else if (nestedChild.type === 'paragraph' || nestedChild.type === 'heading') {
          // If the list item child is a paragraph or heading, remove the wrapper
          newNestedChildren.push(...(nestedChild.children ?? []));
        } else {
          // If the list item child is anything else (e.g. list item), add it normally
          newNestedChildren.push(nestedChild);
        }
      }

      // Add in the normalized list item with its normalized children, as well as the nested lists
      newChildren.push({ ...normalizedChild, children: newNestedChildren });
      newChildren.push(...nestedLists);
    } else {
      // Push in normally if it is not a list item
      newChildren.push(normalizedChild);
    }
  }

  return { ...node, children: newChildren };
};

const isCheckListItem = (node: MdastNode): boolean => {
  return typeof node.checked === 'boolean';
};

/**
 * This function pulls checklist items out of lists (splitting the list)
 */
const normalizeCheckListItems = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];
  for (const child of node.children) {
    const normalizedChild = normalizeCheckListItems(child);

    if (!normalizedChild.children) {
      // No children, just push in normally
      newChildren.push(normalizedChild);
      continue;
    }

    if (normalizedChild.type === 'list') {
      const blocks: MdastNode[] = [];

      for (const listChild of normalizedChild.children) {
        if (isCheckListItem(listChild)) {
          // Checklist items should be pulled out
          blocks.push(listChild);
        } else {
          // Add a new block if it doesn't exist yet
          if (blocks.length <= 0 || isCheckListItem(blocks[blocks.length - 1])) {
            blocks.push({ type: normalizedChild.type, children: [] });
          }
          // Push in listChild at the same level
          blocks[blocks.length - 1].children?.push(listChild);
        }
      }

      newChildren.push(...blocks);
    } else {
      newChildren.push(normalizedChild);
    }
  }

  return { ...node, children: newChildren };
};

/**
 * This function splits images into their own block if necessary (splitting the parent node)
 */
const normalizeImages = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];

  for (const child of node.children) {
    const normalizedChild = normalizeImages(child); // Normalize child

    if (!normalizedChild.children) {
      // No children, just push in normally
      newChildren.push(normalizedChild);
      continue;
    }

    // Pull the image out into its own block if it's not the child of a list
    if (normalizedChild.type !== 'list' && normalizedChild.children.some(nestedChild => nestedChild.type === 'image')) {
      const blocks: MdastNode[] = [];

      // Split children into separate blocks
      for (const nestedChild of normalizedChild.children) {
        if (nestedChild.type === 'image') {
          blocks.push(nestedChild);
        }
        // Nested child is a text node
        else {
          // Add a new block if it doesn't exist yet
          if (blocks.length <= 0 || blocks[blocks.length - 1].type === 'image') {
            blocks.push({ type: normalizedChild.type, children: [] });
          }
          blocks[blocks.length - 1].children?.push(nestedChild);
        }
      }

      newChildren.push(...blocks);
    } else {
      newChildren.push(normalizedChild);
    }
  }

  return { ...node, children: newChildren };
};

/**
 * This function converts <details><summary> content into custom DetailsDisclosureElement
 */
const normalizeDetailsDisclosure = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];
  let detailsDisclosureNode: MdastNode = { type: 'detailsDisclosure', detailsSummaryText: '', children: [] };
  let partsCounter = 0;

  for (const child of node.children) {
    if (child.type === 'html' && child.value?.startsWith('<details><summary>')) {
      partsCounter++;
      const summaryMatch = child.value?.match('<summary>(.*)</summary>');
      detailsDisclosureNode.detailsSummaryText = summaryMatch ? summaryMatch[1] : '';
      detailsDisclosureNode.position = child.position;
    } else if (partsCounter === 1) {
      partsCounter++;
      detailsDisclosureNode.children = child.children;
    } else if (partsCounter === 2) {
      newChildren.push(detailsDisclosureNode);
      partsCounter = 0;
      detailsDisclosureNode = { type: 'detailsDisclosure', detailsSummaryText: '', children: [] };
    } else {
      newChildren.push(child);
    }
  }

  return { ...node, children: newChildren };
};

/**
 * This function converts iframes into Embed nodes
 */
const normalizeEmbeds = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];

  for (const child of node.children) {
    if (child.type === 'html' && child.value?.startsWith('<iframe')) {
      const srcMatch = /src="([^"]*)"/.exec(child.value);
      const url = srcMatch ? srcMatch[1] : '';
      const embedNode: MdastNode = {
        type: 'embed',
        url: url,
        oembed: { type: 'rich', html: child.value, version: '1.0' },
        children: [],
      };
      newChildren.push(embedNode);
    } else {
      newChildren.push(child);
    }
  }

  return { ...node, children: newChildren };
};

/**
 * This function converts blockquote-based callouts into Callout nodes
 */
const normalizeCallouts = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];

  for (const child of node.children) {
    const callout = findCallout(child);

    if (callout) {
      newChildren.push(callout);
    } else {
      newChildren.push(child);
    }
  }

  return { ...node, children: newChildren };
};

const findCallout = (node: MdastNode) => {
  if (node.type !== 'blockquote' || !node.children || node.children[0].type !== 'paragraph') return;

  const [paragraph, ...otherBlockquoteChildren] = node.children;
  if (!paragraph.children?.length || paragraph.children[0].type !== 'text') return;

  const [t, ...otherParagraphChildren] = paragraph.children;
  const regex = new RegExp(`^\\[!(?<keyword>(.*?))\\][\t\f ]?(?<title>.*?)$`, 'gi');
  const m = regex.exec(t.value?.replace('\n', '') ?? '');
  if (!m) return;

  const [key, title] = [m.groups?.keyword, m.groups?.title];
  if (!key) return;

  const keyword = key.toLowerCase();
  const defaultKeywords: string = Object.keys(calloutTypes).map(escapeRegExp).join('|');
  const isOneOfKeywords: boolean = new RegExp(defaultKeywords).test(keyword);
  const calloutType = isOneOfKeywords ? calloutTypeFromKeyword(keyword, calloutTypes) : 'note';
  const calloutNode: MdastNode = {
    type: 'callout',
    calloutType: calloutType,
    title: title,
    content: [...otherParagraphChildren, ...otherBlockquoteChildren],
    children: [],
  };

  return calloutNode;
};

/**
 * This function combines footnoteReference and footnoteDefinition nodes into custom Footnote element
 */
const normalizeFootnotes = (node: MdastNode): MdastNode => {
  if (!node.children) {
    return node;
  }

  const newChildren = [];
  const footnoteDefinitions: { id?: string; definition: MdastNode[] }[] = [];

  for (const child of node.children) {
    if (child.type === 'footnoteDefinition') {
      footnoteDefinitions.push({ id: child.identifier ?? child.label, definition: child.children ?? [] });
      continue;
    }

    if (child.children && child.children.some(c => c.type === 'footnoteReference')) {
      const newNestedChildren = [];

      for (const nestedChild of child.children) {
        if (nestedChild.type === 'footnoteReference') {
          newNestedChildren.push({
            type: 'footnote',
            identifier: nestedChild.identifier ?? nestedChild.label,
            position: nestedChild.position,
            children: [],
          });
        } else {
          newNestedChildren.push(nestedChild);
        }
      }
      newChildren.push({ ...child, children: newNestedChildren });
    } else {
      newChildren.push(child);
    }
  }

  const hasFootnotes = newChildren.some(n => n.children && n.children.some(c => c.type === 'footnote'));
  if (!hasFootnotes) {
    return { ...node, children: newChildren };
  }

  return {
    ...node,
    children: newChildren.map(n =>
      !n.children
        ? n
        : {
            ...n,
            children: n.children.map(c => {
              if (c.type === 'footnote') {
                const footnoteDef = footnoteDefinitions.find(fnDef => fnDef.id === c.identifier)?.definition;
                return footnoteDef ? { ...c, definition: footnoteDef } : c;
              } else {
                return c;
              }
            }),
          },
    ),
  };
};
