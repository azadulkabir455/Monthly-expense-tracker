import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyACcGPWt4xCHiLiQetEarUU1NriaNLiyq4",
  authDomain: "monthly-expenses-tracker-3d546.firebaseapp.com",
  projectId: "monthly-expenses-tracker-3d546",
  storageBucket: "monthly-expenses-tracker-3d546.firebasestorage.app",
  messagingSenderId: "189110745577",
  appId: "1:189110745577:web:15f26e2228cfea66a0b378",
};

export const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
