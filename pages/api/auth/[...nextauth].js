import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// import { verifyPassword } from '../../../lib/auth';
// import { connectToDatabase } from '../../../lib/db';

export default NextAuth({
  session: {
    jwt: true,
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const client = await connectToDatabase();
        const usersCollection = client.db().collection('users');
        const user = await usersCollection.findOne({ username: credentials.username });

        if (!user) {
          client.close();
          throw new Error('Invalid username or password');
        }

        const isValid = await verifyPassword(credentials.password, user.password);

        if (!isValid) {
          client.close();
          throw new Error('Invalid username or password');
        }

        client.close();
        return { name: user.username };
      },
    }),
  ],
});
