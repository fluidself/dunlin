import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async context => {
  const { accessToken } = context.req.cookies;

  if (!accessToken) {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return { props: {} };
};

export default function Protected() {
  return <div className="text-white">Protected route</div>;
}
