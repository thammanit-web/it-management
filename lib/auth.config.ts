import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isLoginPage = nextUrl.pathname === "/login";
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      
      if (!isLoggedIn && !isLoginPage) {
        return false; // Redirect to /login
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Security: Prevent non-admins from accessing admin routes
      if (isAdminRoute && role !== "admin") {
        return Response.redirect(new URL("/", nextUrl)); // Redirect to dashboard/root
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? "user";
        session.user.id = token.id as string;
        session.user.employeeId = token.employeeId;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts to avoid Edge Runtime issues
} satisfies NextAuthConfig;
