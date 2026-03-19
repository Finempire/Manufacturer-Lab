import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const rolePathMap: Record<string, string> = {
      ACCOUNTANT: "/dashboard/accountant",
      SENIOR_MERCHANDISER: "/dashboard/senior-merchandiser",
      PRODUCTION_MANAGER: "/dashboard/production",
      MERCHANDISER: "/dashboard/merchandiser",
      STORE_MANAGER: "/dashboard/manager",
      RUNNER: "/dashboard/runner",
      CEO: "/dashboard/ceo",
    };

    if (token?.must_change_password && path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (path.startsWith("/dashboard")) {
      const userRole = token?.role as string;
      const allowedBase = rolePathMap[userRole];

      if (!allowedBase || !path.startsWith(allowedBase)) {
        const correctPath = allowedBase || "/login";
        return NextResponse.redirect(new URL(correctPath, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
