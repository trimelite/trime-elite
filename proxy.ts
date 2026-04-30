import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "trim-elite-secret-key-change-in-production-2024"
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/dashboard and deeper
  if (!pathname.startsWith("/admin/dashboard")) return NextResponse.next();

  const token = req.cookies.get("te_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin", req.url));

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
