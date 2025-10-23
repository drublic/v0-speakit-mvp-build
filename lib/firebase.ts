import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  const isValidString = (value: any): boolean => {
    return typeof value === "string" && value.trim().length > 0 && value !== "undefined" && value !== "null"
  }

  const isConfigured = !!(
    isValidString(firebaseConfig.apiKey) &&
    isValidString(firebaseConfig.authDomain) &&
    isValidString(firebaseConfig.projectId) &&
    isValidString(firebaseConfig.appId)
  )

  if (!isConfigured && typeof window !== "undefined") {
    console.info(
      "ℹ️ Firebase not configured. The app will work in demo mode without authentication. To enable auth features, add Firebase environment variables in the Vars section.",
    )
  }

  return isConfigured
}

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseDb: Firestore | null = null
let initializationAttempted = false

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getFirebaseAuth(): Promise<Auth | null> {
  // Only run on client side
  if (typeof window === "undefined") {
    return null
  }

  // Return cached instance
  if (firebaseAuth) {
    return firebaseAuth
  }

  // Don't retry if already attempted and failed
  if (initializationAttempted && !firebaseAuth) {
    return null
  }

  // Don't initialize if not configured
  if (!isFirebaseConfigured()) {
    initializationAttempted = true
    return null
  }

  try {
    // Initialize app if needed
    if (!firebaseApp) {
      const existingApps = getApps()
      if (existingApps.length > 0) {
        firebaseApp = existingApps[0]
      } else {
        firebaseApp = initializeApp(firebaseConfig)
        await delay(100)
      }
    }

    try {
      firebaseAuth = getAuth(firebaseApp)
      return firebaseAuth
    } catch (authError: any) {
      // Suppress the "Component auth has not been registered yet" error
      if (authError.message?.includes("not been registered")) {
        console.warn("⚠️ Firebase Auth could not initialize. App will run in demo mode.")
      } else {
        console.error("Firebase Auth error:", authError.message)
      }
      initializationAttempted = true
      return null
    }
  } catch (error: any) {
    console.error("Firebase initialization failed:", error.message)
    initializationAttempted = true
    return null
  }
}

export async function getFirebaseDb(): Promise<Firestore | null> {
  // Only run on client side
  if (typeof window === "undefined") {
    return null
  }

  // Return cached instance
  if (firebaseDb) {
    return firebaseDb
  }

  // Don't initialize if not configured
  if (!isFirebaseConfigured()) {
    return null
  }

  try {
    // Initialize app if needed
    if (!firebaseApp) {
      const existingApps = getApps()
      if (existingApps.length > 0) {
        firebaseApp = existingApps[0]
      } else {
        firebaseApp = initializeApp(firebaseConfig)
        await delay(100)
      }
    }

    try {
      firebaseDb = getFirestore(firebaseApp)
      return firebaseDb
    } catch (dbError: any) {
      console.warn("⚠️ Firebase Firestore could not initialize. App will run in demo mode.")
      return null
    }
  } catch (error: any) {
    console.error("Firebase Firestore initialization failed:", error.message)
    return null
  }
}
