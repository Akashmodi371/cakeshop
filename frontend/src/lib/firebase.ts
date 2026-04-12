import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export function getFirebaseAuth() {
  if (typeof window === 'undefined') return null
  
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  
  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
  return getAuth(app)
}