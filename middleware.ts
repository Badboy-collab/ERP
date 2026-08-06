import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static assets, icons, and auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/super-admin/login")
  ) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionToken = request.cookies.get("session")?.value;

  // Verify JWT session
  const user = sessionToken ? await verifyJWT(sessionToken) : null;

  // Not authenticated
  if (!user) {
    if (pathname.startsWith("/super-admin")) {
      const loginUrl = new URL("/super-admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    } else if (pathname !== "/") {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated
  if (pathname === "/") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - super-admin/login
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth/|super-admin/login|_next/static|_next/image|favicon.ico).*)",
  ],
};
