import type { AuthError } from "firebase/auth";

export function getAuthErrorMessage(error: AuthError): string {
  const code = error.code;
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "This email is already registered. Try signing in.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Contact support.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Popup was blocked. Allow popups and try again.",
    "auth/cancelled-popup-request": "Only one sign-in request at a time.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return messages[code] ?? error.message ?? "Something went wrong. Try again.";
}
