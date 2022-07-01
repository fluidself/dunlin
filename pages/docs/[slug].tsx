import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import Sidebar from 'components/docs/Sidebar';
import { getDocEntryBySlug, getAllDocEntries, parseMarkdownBody } from 'lib/docs';

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
      <div className="flex flex-col md:flex-row docs">
        <Sidebar />
        <main className="mt-16 md:mt-12 px-2 md:px-0 pb-4 container mx-auto md:max-w-3xl publication">
          <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }}></article>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug) return { props: {} };

  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const { content } = getDocEntryBySlug(slug);
  const parsedContent = await parseMarkdownBody(content);

  return {
    props: {
      content: parsedContent,
    },
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  const slugs = getAllDocEntries();

  return {
    paths: slugs.map(slug => ({
      params: {
        slug,
      },
    })),
    fallback: false,
  };
};
