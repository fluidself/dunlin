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
        <title>Docs | Dunlin</title>
      </Head>
      <div className="flex flex-col md:flex-row docs">
        <Sidebar />
        <main className="mt-16 md:mt-12 px-2 md:px-0 container mx-auto md:max-w-3xl publication">
          <article
            className="prose prose-invert max-w-none prose-a:text-primary-500 hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: content }}
          ></article>
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
