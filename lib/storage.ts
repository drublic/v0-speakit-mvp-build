import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
  type Firestore,
} from "firebase/firestore"
import { getFirebaseDb } from "./firebase"

export interface SavedContent {
  id: string
  userId: string
  title: string
  content: string
  url?: string
  type: "url" | "pdf"
  summary?: string
  createdAt: Timestamp
  lastAccessedAt: Timestamp
}

async function getDb(): Promise<Firestore> {
  const db = await getFirebaseDb()
  if (!db) {
    throw new Error("Firebase Firestore not initialized")
  }
  return db
}

export async function saveContent(
  userId: string,
  data: {
    title: string
    content: string
    url?: string
    type: "url" | "pdf"
    summary?: string
  },
): Promise<string> {
  const db = await getDb()
  const contentRef = doc(collection(db, "saved_content"))
  const contentData = {
    userId,
    ...data,
    createdAt: serverTimestamp(),
    lastAccessedAt: serverTimestamp(),
  }

  await setDoc(contentRef, contentData)
  return contentRef.id
}

export async function getUserContent(userId: string): Promise<SavedContent[]> {
  const db = await getDb()
  const q = query(collection(db, "saved_content"), where("userId", "==", userId), orderBy("lastAccessedAt", "desc"))

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SavedContent[]
}

export async function getContentById(contentId: string): Promise<SavedContent | null> {
  const db = await getDb()
  const docRef = doc(db, "saved_content", contentId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SavedContent
  }

  return null
}

export async function updateLastAccessed(contentId: string): Promise<void> {
  const db = await getDb()
  const docRef = doc(db, "saved_content", contentId)
  await setDoc(docRef, { lastAccessedAt: serverTimestamp() }, { merge: true })
}

export async function deleteContent(contentId: string): Promise<void> {
  const db = await getDb()
  const docRef = doc(db, "saved_content", contentId)
  await deleteDoc(docRef)
}
