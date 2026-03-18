import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type UserRole =
  | "ACCOUNTANT"
  | "SENIOR_MERCHANDISER"
  | "PRODUCTION_MANAGER"
  | "MERCHANDISER"
  | "STORE_MANAGER"
  | "RUNNER"
  | "CEO";

export const ROLE_LABELS: Record<UserRole, string> = {
  ACCOUNTANT: "Accountant",
  SENIOR_MERCHANDISER: "Sample Production Manager",
  PRODUCTION_MANAGER: "Production Manager",
  MERCHANDISER: "Merchandiser",
  STORE_MANAGER: "Store Manager",
  RUNNER: "Runner",
  CEO: "CEO",
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (!user.is_active) {
          throw new Error("Account deactivated. Contact administrator.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          must_change_password: user.must_change_password,
          runner_status: user.runner_status,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.must_change_password = user.must_change_password;
        token.runner_status = user.runner_status;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.must_change_password = token.must_change_password;
        session.user.runner_status = token.runner_status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
