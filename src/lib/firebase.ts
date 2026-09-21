import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

let emulatorsConnected = false;

export function connectFirebaseEmulators() {
  if (emulatorsConnected || typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "true") return;

  connectAuthEmulator(firebaseAuth, "http://localhost:9099", { disableWarnings: true });
  connectStorageEmulator(firebaseStorage, "localhost", 9199);
  emulatorsConnected = true;
}
