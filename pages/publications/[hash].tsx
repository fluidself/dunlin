import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
import { LANGUAGE_CLASSES, TOKEN_CLASSES } from 'editor/decorateCodeBlocks';
import { addEllipsis } from 'utils/string';
import { getReadableDatetime } from 'utils/date';
import PageLoading from 'components/PageLoading';
import dunlinLogo from 'public/dunlin-logo.png';

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
      const parsedBody = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(wikiLinkPlugin, { aliasDivider: '|' })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypePrism)
        .use(rehypeRaw)
        .use(rehypeSanitize, {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            pre: [...(defaultSchema.attributes?.pre || []), ['className', ...LANGUAGE_CLASSES]],
            code: [...(defaultSchema.attributes?.code || []), ['className', ...LANGUAGE_CLASSES]],
            span: [...(defaultSchema.attributes?.span || []), ['className', ...LANGUAGE_CLASSES, ...TOKEN_CLASSES]],
          },
        })
        .use(rehypeStringify)
        .processSync(body);

      setParsedBody(String(parsedBody));
    };

    process();
  }, [cid, address, timestamp, title, body]);

  if (!parsedBody) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <header className="header sticky top-0 flex items-center justify-between pl-10 py-6">
        <Link href="/" className="flex items-center focus:outline-none">
          <Image src={dunlinLogo} alt="Dunlin logo" width={24} height={24} />
          <div className="ml-2">Dunlin</div>
        </Link>
      </header>
      <main className="mt-12 container mx-auto md:max-w-3xl publication">
        <h1 className="text-5xl font-semibold text-gray-100 mb-5">{title}</h1>
        <div className="flex space-x-4">
          <span className="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
            {addEllipsis(address)}
          </span>
          <span className="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
            {getReadableDatetime(timestamp)}
          </span>
        </div>

        <article
          className="prose prose-invert max-w-none mt-10 prose-table:border prose-table:border-collapse prose-th:border prose-th:border-gray-700 prose-th:align-baseline prose-th:pt-2 prose-th:pl-2 prose-td:border prose-td:border-gray-700 prose-td:pt-2 prose-td:pl-2 prose-a:text-primary-500 hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: parsedBody }}
        ></article>

        <div className="flex flex-col mt-20 mb-12 border border-gray-700 rounded text-gray-400 text-sm">
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
