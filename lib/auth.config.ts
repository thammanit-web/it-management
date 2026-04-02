import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
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
        token.role = (user as any).role;
        token.id = user.id;
        token.employeeId = (user as any).employeeId;
        
        // Fetch name since it's not standard
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { employee: true }
        });
        token.name = dbUser?.employee?.employee_name_en || dbUser?.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).employeeId = token.employeeId;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts to avoid Edge Runtime issues
} satisfies NextAuthConfig;
