import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
// @ts-expect-error - NextAuth types compatibility issue with Next.js 15
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './database/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours quand Remember Me
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours quand Remember Me
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session?.user) {
        // Vérifier que l'utilisateur existe toujours en base
        const userExists = await prisma.user.findUnique({
          where: { id: token.id },
          select: { id: true, email: true, firstName: true, lastName: true },
        });

        if (!userExists) {
          // L'utilisateur n'existe plus, invalider la session
          console.log(
            `🚨 Utilisateur ${token.id} n'existe plus, session invalidée`
          );
          return null;
        }

        session.user.id = token.id as string;
        session.user.email = userExists.email;
        session.user.firstName = userExists.firstName;
        session.user.lastName = userExists.lastName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
};
