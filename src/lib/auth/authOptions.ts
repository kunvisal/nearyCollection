import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Missing username or password");
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username }
                });

                if (!user || !user.isActive) {
                    throw new Error("Invalid username or password");
                }

                // In a real app we'd compare password hashes, e.g. using bcrypt
                // const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
                const isValid = credentials.password === user.passwordHash;

                if (!isValid) {
                    throw new Error("Invalid username or password");
                }

                return {
                    id: user.id,
                    name: user.fullName,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/signin',
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
