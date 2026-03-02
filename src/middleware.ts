import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/((?!api|_next/static|_next/image|favicon.ico|images|rsvp|unsub).*)",
  ],
};
