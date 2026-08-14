import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log(`[http] ${req.method} ${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
