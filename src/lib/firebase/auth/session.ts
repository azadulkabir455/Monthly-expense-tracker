const SESSION_API = "/api/auth/session";

export async function setSessionCookie(idToken: string): Promise<void> {
  await fetch(SESSION_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  });
}

export async function clearSessionCookie(): Promise<void> {
  await fetch(SESSION_API, { method: "DELETE" });
}
