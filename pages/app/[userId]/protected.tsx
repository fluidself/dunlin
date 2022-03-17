import { withIronSessionSsr } from 'iron-session/next';
import { InferGetServerSidePropsType } from 'next';
import { ironOptions } from 'constants/iron-session';

export default function Protected({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <div className="text-white">Protected route</div>;
}

export const getServerSideProps = withIronSessionSsr(async function ({ params, req, res }) {
  // if page name is [id].js , then params will look like { id: ... }
  console.log(req.session);
  const user = req.session.user;
  const allowedDeck = req.session.allowedDeck;

  // !user || allowedDeck !== params.deck
  if (!user || allowedDeck !== '') {
    return {
      redirect: { destination: '/', permanent: false },
    };
  }

  return {
    // props: { user: req.session.user },
    props: {},
  };
}, ironOptions);
