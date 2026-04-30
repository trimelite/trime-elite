import { NextRequest } from "next/server";
import { validateCredentials, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }
    if (!validateCredentials(email, password)) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = await signToken(email);
    await setSessionCookie(token);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
