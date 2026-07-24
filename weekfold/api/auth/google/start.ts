import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '../../lib/firebase-admin'
import { createGoogleOAuthClient, GOOGLE_CALENDAR_SCOPE } from '../../lib/google'

function getIdToken(request: VercelRequest) {
  const authorization = request.headers.authorization
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length)
  return request.body?.idToken || request.query.idToken
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!['GET', 'POST'].includes(request.method || '')) {
    response.setHeader('Allow', 'GET, POST')
    return response.status(405).json({ error: 'Método no permitido.' })
  }

  try {
    const idToken = getIdToken(request)
    if (!idToken || typeof idToken !== 'string') {
      return response.status(401).json({ error: 'Debes enviar un token de Firebase Authentication.' })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const calendarId = request.body?.calendarId || request.query.calendarId
    if (typeof calendarId !== 'string') {
      return response.status(400).json({ error: 'Debes indicar el calendario de Weekfold a sincronizar.' })
    }

    const calendarSnapshot = await adminDb.collection('calendars').doc(calendarId).get()
    if (!calendarSnapshot.data()?.memberIds?.includes(decodedToken.uid)) {
      return response.status(403).json({ error: 'No tienes acceso a este calendario.' })
    }

    const state = randomUUID()
    await adminDb.collection('google_oauth_states').doc(state).set({
      uid: decodedToken.uid,
      calendarId,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    })

    const oauth2Client = createGoogleOAuthClient()
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [GOOGLE_CALENDAR_SCOPE],
      state,
    })

    return response.redirect(302, authorizationUrl)
  } catch (error) {
    console.error('Google OAuth start failed', error)
    return response.status(500).json({ error: 'No se pudo iniciar la conexión con Google Calendar.' })
  }
}
