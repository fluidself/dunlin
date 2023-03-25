import mermaid from 'mermaid';

export const renderGraph = (id: string, definition: string) => {
  try {
    const svgCode = mermaid.mermaidAPI.render(id, definition, svgCode => svgCode);
    return svgCode;
  } catch (e) {
    const message = (e instanceof Error ? e.message : e) as unknown as string;
    return `Error parsing Mermaid diagram!\n\n${message}`;
  }
};

// Finds Mermaid code blocks in input string and generates Mermaid diagrams from them
// Returns updated string, generated diagrams, and classnames to allow in rehype-sanitize
export function replaceMermaidCodeBlocks(input: string) {
  const mermaidBlocksInString = /^[^\S\n]*```(?:mermaid)(?:\r?\n([\s\S]*?))```[^\S\n]*$/;
  const mermaidBlocksInStringRegexGlobal = new RegExp(mermaidBlocksInString, 'gm');
  const svgs: { id: number; html: string }[] = [];
  const classNames: string[] = [];
  let output = input;
  let i = 0;

  mermaid.initialize(mermaidConfig(true));

  for (const mermaidCodeblockMatch of input.matchAll(mermaidBlocksInStringRegexGlobal)) {
    const mermaidDefinition = mermaidCodeblockMatch[1];
    const result = renderGraph(`mermaid-${i}`, mermaidDefinition);
    // If Mermaid can't parse the definition, just pass it through and let it render as a code block
    if (!result.includes('Error parsing Mermaid diagram')) {
      output = output.replace(mermaidCodeblockMatch[0], `<pre class="mermaid-${i}"></pre>`);
      svgs.push({ id: i, html: result });
      classNames.push(`mermaid-${i}`);
    }
    i++;
  }

  return { output, svgs, classNames };
}

export const mermaidConfig = (darkMode: boolean) => ({
  startOnLoad: false,
  theme: darkMode ? 'dark' : 'light',
  pie: { useWidth: 640 },
  themeVariables: {
    fontFamily: '"Roboto Mono", monospace',
    mainBkg: darkMode ? '#404040' : '#f5f5f5',
    nodeBorder: '#737373',
    actorBorder: darkMode ? '#fff' : '#737373',
    pie1: '#8dd3c7',
    pie2: '#ffffb3',
    pie3: '#bebada',
    pie4: '#fb8072',
    pie5: '#80b1d3',
    pie6: '#fdb462',
    pie7: '#b3de69',
    pie8: '#fccde5',
    pie9: '#d9d9d9',
    pie10: '#bc80bd',
    pie11: '#ccebc5',
    pie12: '#ffed6f',
  },
});
