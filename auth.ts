

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { prompt: "login", max_age: "0" } },
    }),

    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        await connectDB();
        const user = await User.findOne({ email }).lean();
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password as string, user.passwordHash as string);
        if (!ok) return null;

        return {
          id: String(user._id),
          name: user.name || "",
          email: user.email,
          image: user.image || "",
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },

  callbacks: {
    
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        if (!user?.email) return false;

        await connectDB();
        await User.updateOne(
          { email: user.email },
          {
            $setOnInsert: { email: user.email },
            $set: { name: user.name ?? "", image: user.image ?? "" },
          },
          { upsert: true },
        );
      }
      return true;
    },

    
    async jwt({ token, user, trigger, session }) {
      
      if (user) {
        token.name = user.name;
        token.email = user.email;
      
        token.image = (user as any).image ?? token.image;
      }

     
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
       

      
        if ((session as any).image) token.image = (session as any).image;
      }

      return token;
    },

    
    async session({ session, token }) {
      if (session.user) {
      
        session.user.id = token.sub as string;

        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;

      
        session.user.image = (token.image as string) ?? session.user.image;
      }
      return session;
    },
  },
});
