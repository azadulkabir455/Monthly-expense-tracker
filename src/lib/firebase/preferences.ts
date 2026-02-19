import {
  doc,
  getDoc,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export type StoredTheme = "light" | "dark";
export type StoredColorTheme =
  | "violet"
  | "blue"
  | "teal"
  | "emerald"
  | "amber"
  | "rose";

export interface UserPreferences {
  theme: StoredTheme;
  colorTheme: StoredColorTheme;
}

const PREFERENCES_COLLECTION = "preferences";
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  colorTheme: "violet",
};

export async function getPreferences(uid: string): Promise<UserPreferences | null> {
  const ref = doc(db, PREFERENCES_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as DocumentData;
  const theme = data?.theme as StoredTheme | undefined;
  const colorTheme = data?.colorTheme as StoredColorTheme | undefined;
  const validThemes: StoredTheme[] = ["light", "dark"];
  const validColors: StoredColorTheme[] = [
    "violet",
    "blue",
    "teal",
    "emerald",
    "amber",
    "rose",
  ];
  if (
    theme &&
    validThemes.includes(theme) &&
    colorTheme &&
    validColors.includes(colorTheme)
  ) {
    return { theme, colorTheme };
  }
  return null;
}

export async function setPreferences(
  uid: string,
  data: Partial<Pick<UserPreferences, "theme" | "colorTheme">>
): Promise<void> {
  const ref = doc(db, PREFERENCES_COLLECTION, uid);
  await setDoc(ref, data, { merge: true });
}

export { DEFAULT_PREFERENCES };
