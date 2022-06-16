import Head from 'next/head';
import { GetStaticProps } from 'next';
import Sidebar from 'components/docs/Sidebar';
import { getDocEntryBySlug, parseMarkdownBody } from 'lib/docs';

type Props = {
  content: string;
};

export default function DocsPage(props: Props) {
  const { content } = props;

  return (
    <>
      <Head>
        <title>Docs | DECK</title>
      </Head>
      <div className="flex docs">
        <Sidebar />
        <main className="mt-12 container mx-auto md:max-w-3xl">
          <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }}></article>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { content } = getDocEntryBySlug('overview');
  const parsedContent = await parseMarkdownBody(content);

  return {
    props: {
      content: parsedContent,
    },
  };
};
