import Document, { Html, Head, Main, NextScript } from 'next/document';

const TITLE = 'Dunlin';
const DESCRIPTION = 'Knowledge management for crypto natives';
const URL = 'https://dunlin.xyz';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en-us">
        <Head>
          <meta name="description" content={DESCRIPTION} />
          <meta name="application-name" content={TITLE} />

          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content={TITLE} />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="theme-color" content="#171717" />

          <meta property="og:title" content={TITLE} />
          <meta property="og:type" content="website" />
          <meta property="og:description" content={DESCRIPTION} />
          <meta property="og:site_name" content={TITLE} />
          <meta property="og:url" content={URL} />
          <meta property="og:image" content={`${URL}/apple-touch-icon.png`} />

          <meta name="twitter:card" content="summary" />
          <meta name="twitter:url" content={URL} />
          <meta name="twitter:title" content={TITLE} />
          <meta name="twitter:description" content={DESCRIPTION} />
          <meta name="twitter:image" content={`${URL}/apple-touch-icon.png`} />
          <meta name="twitter:creator" content="@fluid_self" />

          <link rel="manifest" href="/manifest.json" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#171717" />

          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#171717" />
          <meta name="msapplication-tap-highlight" content="no" />
        </Head>
        <body className="bg-gray-900 text-gray-100">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
