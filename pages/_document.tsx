import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600;700&display=swap" />
        </Head>
        <body className="bg-background font-display">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
