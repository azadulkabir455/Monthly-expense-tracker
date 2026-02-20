/**
 * Returns a user-friendly message for wishlist Firestore/auth errors.
 */
export function getWishlistErrorMessage(
  err: unknown,
  context: "add" | "update" | "delete",
  kind: "category" | "priority" | "wish"
): string {
  if (err instanceof Error) {
    if (err.message === "NOT_AUTHENTICATED") {
      return "Please sign in first.";
    }
    if (err.message === "ORDER_TAKEN") {
      return "This order is already used by another type. Use a unique order.";
    }
    // Firestore errors (FirebaseError has code)
    const code = (err as { code?: string }).code;
    if (code === "permission-denied" || code === "unauthenticated") {
      return "Permission denied. Sign in and ensure Firestore rules are deployed.";
    }
    if (code === "unavailable" || code === "resource-exhausted") {
      return "Network error. Try again in a moment.";
    }
  }
  const action = context === "add" ? "add" : context === "update" ? "update" : "delete";
  const what = kind === "category" ? "category" : kind === "priority" ? "priority type" : "wish item";
  return `Could not ${action} ${what}. Try again.`;
}
