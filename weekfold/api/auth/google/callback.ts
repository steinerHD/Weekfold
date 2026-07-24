import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '../../lib/firebase-admin.js'
import { createCalendarClient, createGoogleOAuthClient } from '../../lib/google.js'
import { buildGoogleEvent } from '../../lib/event-resource.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Método no permitido.' })
  }

  const code = request.query.code
  const state = request.query.state
  if (typeof code !== 'string' || typeof state !== 'string') {
    return response.status(400).send('Google no devolvió un código de autorización válido.')
  }

  const stateRef = adminDb.collection('google_oauth_states').doc(state)
  try {
    const stateSnapshot = await stateRef.get()
    const { uid, calendarId, expiresAt } = stateSnapshot.data() || {}
    await stateRef.delete()
    if (!stateSnapshot.exists || typeof uid !== 'string' || typeof calendarId !== 'string' || !(expiresAt instanceof Timestamp) || expiresAt.toDate() < new Date()) {
      return response.status(400).send('La autorización expiró. Intenta sincronizar el calendario otra vez.')
    }

    const oauth2Client = createGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    const integrationRef = adminDb.collection('google_integrations').doc(uid)
    const integration = (await integrationRef.get()).data()
    const refreshToken = tokens.refresh_token || integration?.refreshToken
    if (!refreshToken) return response.status(400).send('Google no entregó un refresh token. Intenta autorizar de nuevo.')

    await integrationRef.set({ refreshToken, connectedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    const calendarMappingRef = integrationRef.collection('calendarMappings').doc(calendarId)
    let calendarMapping: { googleCalendarId?: string } | undefined = (await calendarMappingRef.get()).data() as { googleCalendarId?: string } | undefined
    const localCalendar = await adminDb.collection('calendars').doc(calendarId).get()
    if (!localCalendar.exists || !localCalendar.data()?.memberIds?.includes(uid)) {
      return response.status(403).send('No tienes acceso a este calendario.')
    }

    const calendarClient = createCalendarClient(refreshToken)
    if (!calendarMapping?.googleCalendarId) {
      const requestBody = {
        summary: localCalendar.data()?.name || 'Weekfold',
        description: 'Calendario sincronizado desde Weekfold.',
        timeZone: 'America/Bogota',
      }

      console.log('[Google OAuth] Creating Google calendar', {
        uid,
        calendarId,
        localCalendarName: localCalendar.data()?.name || 'Weekfold',
        requestBody,
      })

      oauth2Client.setCredentials({ refresh_token: refreshToken })
      const accessTokenResult = await oauth2Client.getAccessToken()
      console.log('[Google OAuth] Google access token ready', {
        uid,
        calendarId,
        hasAccessToken: Boolean(accessTokenResult.token),
        expiryDate: oauth2Client.credentials.expiry_date,
        tokenType: oauth2Client.credentials.token_type,
      })

      const createdCalendar = await calendarClient.calendars.insert({ requestBody })
      console.log('[Google OAuth] calendars.insert response', {
        uid,
        calendarId,
        status: createdCalendar.status,
        statusText: createdCalendar.statusText,
        data: createdCalendar.data,
      })

      const googleCalendarId = createdCalendar.data?.id
      if (!googleCalendarId) {
        throw new Error('Google Calendar no devolvió el identificador del calendario.')
      }

      console.log('[Google OAuth] Adding calendar to user calendar list', {
        uid,
        calendarId,
        googleCalendarId,
        requestBody: { id: googleCalendarId, selected: true },
      })

      const calendarListEntry = await calendarClient.calendarList.insert({
        requestBody: { id: googleCalendarId, selected: true },
      })
      console.log('[Google OAuth] calendarList.insert response', {
        uid,
        calendarId,
        googleCalendarId,
        status: calendarListEntry.status,
        statusText: calendarListEntry.statusText,
        data: calendarListEntry.data,
      })

      calendarMapping = { googleCalendarId }
      await calendarMappingRef.set({ ...calendarMapping, localCalendarName: localCalendar.data()?.name || 'Weekfold', createdAt: FieldValue.serverTimestamp() })

      const events = await localCalendar.ref.collection('events').get()
      await Promise.all(events.docs.map(async (event) => {
        const createdEvent = await calendarClient.events.insert({ calendarId: googleCalendarId, requestBody: buildGoogleEvent(event.data()) })
        if (createdEvent.data.id) {
          await calendarMappingRef.collection('eventMappings').doc(event.id).set({ googleEventId: createdEvent.data.id, eventPath: event.ref.path })
        }
      }))
    }

    return response.redirect(302, `/calendar/${calendarId}`)
  } catch (error) {
    console.error('Google OAuth callback failed', error)
    return response.status(500).send('No se pudo completar la sincronización con Google Calendar.')
  }
}
