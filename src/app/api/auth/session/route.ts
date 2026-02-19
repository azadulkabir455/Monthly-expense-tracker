import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "auth_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : null;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      path: "/",
      maxAge: MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
