import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as Name from 'w3name';
import { IconExternalLink } from '@tabler/icons';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypePrism from 'rehype-prism';
import remarkCallouts, { calloutTypes, decorateCallouts } from 'lib/remark-callouts';
import { LANGUAGE_CLASSES, TOKEN_CLASSES } from 'editor/decorateCodeBlocks';
import { addEllipsis } from 'utils/string';
import { getReadableDatetime } from 'utils/date';
import PageLoading from 'components/PageLoading';
import DunlinIcon from 'components/DunlinIcon';

type Publication = {
  title: string;
  body: string;
  address: string;
  timestamp: number;
};

type Props = {
  publication: Publication;
  cid: string;
};

export default function PublicationPage(props: Props) {
  const {
    publication: { address, timestamp, title, body },
    cid,
  } = props;
  const [parsedBody, setParsedBody] = useState<string | null>(null);

  useEffect(() => {
    const process = async () => {
      const svgEntries: { id: number; html: string }[] = [];
      const mermaidClasses: string[] = [];
      let processedBody = body;

      // If publication body includes Mermaid code blocks, replace them with generated diagrams.
      // Broken up in a two-step process to not lose the SVG code in other parsing and sanitizing
      if (body.indexOf('```mermaid') !== -1) {
        const { replaceMermaidCodeBlocks } = await import('utils/mermaid');
        const { output, svgs, classNames } = replaceMermaidCodeBlocks(body);
        svgEntries.push(...svgs);
        mermaidClasses.push(...classNames);
        processedBody = output;
      }

      const parsedBody = await unified()
        .use(remarkParse)
        .use(remarkCallouts)
        .use(remarkGfm)
        .use(wikiLinkPlugin, { aliasDivider: '|' })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypePrism)
        .use(rehypeRaw)
        .use(rehypeSanitize, {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            pre: [...(defaultSchema.attributes?.pre || []), ['className', ...LANGUAGE_CLASSES, ...mermaidClasses]],
            code: [...(defaultSchema.attributes?.code || []), ['className', ...LANGUAGE_CLASSES]],
            span: [
              ...(defaultSchema.attributes?.span || []),
              ['className', 'callout-icon', ...LANGUAGE_CLASSES, ...TOKEN_CLASSES],
            ],
            blockquote: [
              ...(defaultSchema.attributes?.blockquote || []),
              ['className', 'callout', ...Object.keys(calloutTypes)],
            ],
            div: [
              ...(defaultSchema.attributes?.div || []),
              ['className', 'callout-title', 'callout-content', 'nested'],
            ],
          },
        })
        .use(rehypeStringify)
        .processSync(processedBody);
      // Fix any double user-content prefixes introduced by rehype-sanitize
      let stringBody = String(parsedBody).replaceAll('user-content-user-content', 'user-content');
      // Replace Mermaid placeholders with SVG diagrams
      for (const svgEntry of svgEntries) {
        const regex = new RegExp(`<pre class="mermaid-${svgEntry.id}"></pre>`, 'gm');
        stringBody = stringBody.replace(regex, `<figure>${svgEntry.html}</figure>`);
      }
      // Style callout elements generated with remark-callouts plugin
      if (stringBody.indexOf('<blockquote class="callout') !== -1) {
        stringBody = decorateCallouts(stringBody);
      }

      setParsedBody(stringBody);
    };

    process();
  }, [cid, address, timestamp, title, body]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const highlightAnchorTarget = (event: MouseEvent) => {
      if (event.target && event.target instanceof HTMLAnchorElement) {
        const hash = new URL(event.target.href).hash.slice(1);
        const target = document.getElementById(hash);
        if (!target) return;

        const originalBgColor = target.style.backgroundColor;
        target.style.backgroundColor = '#828324';
        target.scrollIntoView();

        timeout = setTimeout(() => {
          target.style.backgroundColor = originalBgColor;
        }, 3000);
      }
    };

    document.addEventListener('click', highlightAnchorTarget);

    return () => {
      document.removeEventListener('click', highlightAnchorTarget);
      clearTimeout(timeout);
    };
  }, []);

  if (!parsedBody) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="w-full h-full min-h-screen bg-gray-900 text-gray-100">
        <header className="header sticky top-0 flex items-center justify-between pl-10 py-6">
          <Link href="/" className="flex items-center focus:outline-none">
            <DunlinIcon />
            <div className="ml-2">Dunlin</div>
          </Link>
        </header>
        <main className="py-12 container mx-auto md:max-w-3xl">
          <h1 className="text-5xl font-heading mb-5">{title}</h1>
          <div className="flex space-x-4">
            <span className="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
              {addEllipsis(address)}
            </span>
            <span className="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
              {getReadableDatetime(timestamp)}
            </span>
          </div>

          <article
            className="prose prose-invert max-w-none mt-10 prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-400 hover:prose-a:underline prose-h1:font-heading prose-h2:font-heading prose-h2:tracking-wider prose-h3:font-heading prose-h3:tracking-wider prose-h4:font-heading prose-h4:tracking-wider prose-pre:!bg-gray-800 prose-pre:!text-gray-100 prose-code:!bg-gray-800 prose-code:!text-gray-100"
            dangerouslySetInnerHTML={{ __html: parsedBody }}
          ></article>

          <div className="flex flex-col mt-20 border border-gray-700 rounded text-gray-400 text-sm">
            <a
              className="hover:bg-gray-800"
              href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex flex-row justify-between p-4 border-b border-gray-700">
                <div className="flex items-center">
                  <span>IPFS CID</span> <IconExternalLink className="ml-2" size={16} />
                </div>
                <div>{cid}</div>
              </div>
            </a>
            <a
              className="hover:bg-gray-800"
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex flex-row justify-between p-4">
                <div className="flex items-center">
                  <span>PUBLISHED BY</span> <IconExternalLink className="ml-2" size={16} />
                </div>
                <div>{address}</div>
              </div>
            </a>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const hash = params?.hash as string;
  let cid: string | undefined;
  let publication: Publication | undefined;

  try {
    if (hash.startsWith('k')) {
      const name = Name.parse(hash);
      const revision = await Name.resolve(name);
      cid = revision.value.replace('/ipfs/', '');
    } else if (hash.startsWith('b')) {
      cid = hash;
    }

    if (!cid) throw new Error('Not found');

    const res = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${cid}`);
    const data = await res.json();

    if (data.address && data.timestamp && data.title && data.body) {
      publication = data;
    }
  } catch (e) {
    return { notFound: true };
  }

  if (!publication) {
    return { notFound: true };
  }

  return {
    props: { publication, cid },
  };
};
