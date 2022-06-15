import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import wikiLinkPlugin from 'remark-wiki-link';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import Sidebar from 'components/docs/Sidebar';
import { getDocEntryBySlug, getAllDocEntries } from 'lib/docs';

type Props = {
  title: string;
  content: string;
};

export default function DocsPage(props: Props) {
  const { title, content } = props;

  return (
    <>
      <Head>
        <title>{title} | DECK</title>
      </Head>
      <div className="flex docs">
        <Sidebar />
        <main className="mt-12 container mx-auto md:max-w-3xl publication">
          <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }}></article>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug) return { props: {} };

  const parseMarkdownBody = async (body: string) => {
    const parsedBody = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(wikiLinkPlugin, { aliasDivider: '|' })
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(body);

    return String(parsedBody);
  };

  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const { title, content } = getDocEntryBySlug(slug);
  const parsedContent = await parseMarkdownBody(content);

  return {
    props: {
      title,
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
