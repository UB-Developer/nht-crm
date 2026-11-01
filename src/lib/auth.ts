import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email.toLowerCase().trim(),
            isDeleted: false,
          },
          include: {
            branch: true,
          },
        });

        if (!user) {
          throw new Error("No user found with this email address");
        }

        if (!user.isActive) {
          throw new Error("This account has been deactivated. Please contact administrator.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password provided");
        }

        // Create an audit log for successful login
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              entity: "User",
              entityId: user.id,
              branchId: user.branchId,
              details: JSON.stringify({ email: user.email, role: user.role }),
            },
          });
        } catch {
          // non-blocking
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branchName: user.branch?.name || "All Branches",
          branchCity: user.branch?.city || "Karachi",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.branchId = (user as unknown as { branchId: string | null }).branchId;
        token.branchName = (user as unknown as { branchName: string }).branchName;
        token.branchCity = (user as unknown as { branchCity: string }).branchCity;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branchId = token.branchId as string | null;
        session.user.branchName = token.branchName as string;
        session.user.branchCity = token.branchCity as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "hajj-umrah-secret-key-32charslong-pk",
};
