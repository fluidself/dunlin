import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
// import { useSigner, useContract } from 'wagmi';
// import { Contract } from 'ethers';
import { addEllipsis } from 'utils/string';
import { getReadableDatetime } from 'utils/date';
import PageLoading from 'components/PageLoading';
// import DECKNFT from 'artifacts/contracts/DECKNFT.sol/DECKNFT.json';
// import { CONTRACT_ADDRESS } from 'constants/nft-contract';

type Publication = {
  title: string;
  body: string;
  address: string;
  timestamp: number;
};

type Props = {
  publication: Publication;
};

export default function PublicationPage(props: Props) {
  const {
    publication: { address, timestamp, title, body },
  } = props;
  const router = useRouter();
  const { hash } = router.query;
  const [parsedBody, setParsedBody] = useState<string | null>(null);

  useEffect(() => {
    const process = async () => {
      const parsedBody = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(wikiLinkPlugin, { aliasDivider: '|' })
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(body);

      setParsedBody(
        `<div class="not-prose">
          <h1 class="text-5xl font-semibold text-[#FFFFFF] mb-4">${title}</h1>
        </div>
        <div class="flex space-x-4">
          <span class="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
            ${addEllipsis(address)}
          </span>
          <span class="text-xs inline-block py-1 px-2.5 leading-none text-center align-baseline bg-gray-800 text-gray-300 rounded">
            ${getReadableDatetime(timestamp)}
          </span>
        </div>` +
          String(parsedBody) +
          `<hr />
          <div class="not-prose">
            <div class="flex flex-col mt-6 mb-12">
              <div class="">IPFS HASH: <a href="https://ipfs.infura.io/ipfs/${hash}" rel="noreferrer" target="_blank"}>${hash}</a></div>
              <div class="">ETHEREUM ADDRESS: <a href="https://etherscan.io/address/${address}" rel="noreferrer" target="_blank"}>${address}</a></div>
            </div>
          </div>`,
      );
    };

    process();
  }, [hash, address, timestamp, title, body]);

  if (!parsedBody) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main className="mt-12 container mx-auto md:max-w-3xl publication">
        <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parsedBody }}></article>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const hash = params?.hash;
  let publication: Publication | undefined;

  try {
    const res = await fetch(`https://ipfs.infura.io/ipfs/${hash}`);
    const data = await res.json();
    if (data) {
      publication = data;
    }
  } catch (e) {
    return {
      notFound: true,
    };
  }

  if (!publication) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      publication,
    },
  };
};
