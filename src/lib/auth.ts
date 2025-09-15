import type {
  NextAuthJWTParams,
  NextAuthSessionParams,
  NextAuthSignInEventParams,
  NextAuthSignOutEventParams,
} from '@/types/NextAuth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
// @ts-expect-error - NextAuth types compatibility issue with Next.js 15
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './Prisma';
import { loginSchema, validateSchema } from './Validation';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        // Validation des données de connexion
        const validation = validateSchema(loginSchema, {
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe === 'true',
        });

        if (!validation.success) {
          throw new Error('Format email invalide');
        }

        const { email, password } = validation.data!;

        // Recherche utilisateur
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('Email ou mot de passe incorrect');
        }

        // Vérification mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error('Email ou mot de passe incorrect');
        }

        return {
          id: user.id,
          email: user.email,
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          rememberMe: credentials.rememberMe === 'true',
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24h par défaut
  },

  callbacks: {
    async jwt({ token, user }: NextAuthJWTParams) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.rememberMe = user.rememberMe;

        // Ajuster la durée de session selon "Remember me"
        if (user.rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 jours
        }
      }
      return token;
    },

    async session({ session, token }: NextAuthSessionParams) {
      if (token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.expires = new Date((token.exp as number) * 1000).toISOString();
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signIn({ user }: NextAuthSignInEventParams) {
      console.log('Connexion réussie:', { userId: user.id, email: user.email });
    },
    async signOut({ token }: NextAuthSignOutEventParams) {
      console.log('Déconnexion:', { userId: token?.id });
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
