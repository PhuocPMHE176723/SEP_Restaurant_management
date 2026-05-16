import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Firebase configuration của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBND_et0FHqz_DICxncp8zxC4EVUbAscj8",
  authDomain: "rmn-g26.firebaseapp.com",
  projectId: "rmn-g26",
  storageBucket: "rmn-g26.firebasestorage.app",
  messagingSenderId: "270855404908",
  appId: "1:270855404908:web:7d9e77a111ff13bcc10749",
  measurementId: "G-43CHWC6HJX"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Cấu hình ngôn ngữ tiếng Việt cho Firebase Auth
auth.languageCode = "vi";

// Firebase Auth Emulator (dev only)
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost";
const emulatorPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || "9099";

if (useEmulator && typeof window !== "undefined") {
  const authAny = auth as typeof auth & { __emulatorInitialized?: boolean };
  if (!authAny.__emulatorInitialized) {
    connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPort}`);
    auth.settings.appVerificationDisabledForTesting = true;
    authAny.__emulatorInitialized = true;
  }
}

export { auth };
