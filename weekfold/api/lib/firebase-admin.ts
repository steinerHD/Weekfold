import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getServiceAccount() {
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!value) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.')

  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY debe contener un JSON válido codificado en Base64.')
  }
}

const app = getApps()[0] || initializeApp({ credential: cert(getServiceAccount()) })

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
