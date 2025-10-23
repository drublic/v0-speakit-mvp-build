"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  type User,
  type Auth,
} from "firebase/auth"
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isGuest: boolean
  isFirebaseAvailable: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInAsGuest: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [auth, setAuth] = useState<Auth | null>(null)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function initializeAuth() {
      try {
        // Skip if not configured
        if (!isFirebaseConfigured()) {
          setLoading(false)
          setIsFirebaseAvailable(false)
          return
        }

        // Try to initialize Firebase Auth
        const firebaseAuth = await getFirebaseAuth()

        if (!firebaseAuth) {
          setLoading(false)
          setIsFirebaseAvailable(false)
          return
        }

        setAuth(firebaseAuth)
        setIsFirebaseAvailable(true)

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(
          firebaseAuth,
          (user) => {
            setUser(user)
            setIsGuest(user?.isAnonymous || false)
            setLoading(false)
          },
          (error) => {
            console.error("Auth state change error:", error)
            setLoading(false)
          },
        )
      } catch (error: any) {
        console.warn("⚠️ Authentication unavailable. Running in demo mode.")
        setLoading(false)
        setIsFirebaseAvailable(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Authentication not available. Please configure Firebase in the Vars section.")
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Authentication not available. Please configure Firebase in the Vars section.")
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    if (!auth) throw new Error("Authentication not available. Please configure Firebase in the Vars section.")
    await firebaseSignOut(auth)
  }

  const signInAsGuest = async () => {
    if (!auth) throw new Error("Authentication not available. Please configure Firebase in the Vars section.")
    await signInAnonymously(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, isGuest, isFirebaseAvailable, signIn, signUp, signOut, signInAsGuest }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
