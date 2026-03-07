import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type UserRole =
    | "ACCOUNTANT"
    | "PRODUCTION_MANAGER"
    | "MERCHANDISER"
    | "STORE_MANAGER"
    | "RUNNER"
    | "CEO";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("NextAuth Authorize: Starting for email", credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log("NextAuth Authorize: Missing email or password");
                    throw new Error("Email and password are required");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    console.log("NextAuth Authorize: User not found in DB");
                    throw new Error("Invalid credentials");
                }

                if (!user.is_active) {
                    console.log("NextAuth Authorize: User found but is_active=false");
                    throw new Error("Invalid credentials");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password_hash
                );

                if (!isValid) {
                    console.log("NextAuth Authorize: bcrypt.compare returned false");
                    throw new Error("Invalid credentials");
                }

                console.log("NextAuth Authorize: Authentication successful for", user.email);

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { last_login_at: new Date() }
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    must_change_password: user.must_change_password,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 1 day
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role: string }).role;
                token.must_change_password = (user as { must_change_password: boolean }).must_change_password;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id: string; role: string; must_change_password: boolean }).id = token.id as string;
                (session.user as { id: string; role: string; must_change_password: boolean }).role =
                    token.role as string;
                (session.user as { id: string; role: string; must_change_password: boolean }).must_change_password =
                    token.must_change_password as boolean;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};
