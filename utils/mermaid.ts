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

export const mermaidConfig = {
  startOnLoad: false,
  theme: 'dark',
  pie: { useWidth: 640 },
  themeVariables: {
    fontFamily: '"Roboto Mono", monospace',
    mainBkg: '#404040',
    nodeBorder: '#737373',
    actorBorder: '#fff',
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
};
