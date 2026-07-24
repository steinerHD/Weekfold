import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth, adminDb } from './lib/firebase-admin.js'
import { createCalendarClient } from './lib/google.js'
import { buildGoogleEvent } from './lib/event-resource.js'

function getBearerToken(request: VercelRequest) {
  const authorization = request.headers.authorization
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Método no permitido.' })
  }

  try {
    const idToken = getBearerToken(request)
    if (!idToken) return response.status(401).json({ error: 'Falta el token de autenticación.' })
    const { uid } = await adminAuth.verifyIdToken(idToken)
    const { calendarId, eventId, action } = request.body || {}

    if (typeof calendarId !== 'string' || typeof eventId !== 'string' || !['create', 'update', 'delete'].includes(action)) {
      return response.status(400).json({ error: 'calendarId, eventId y action válidos son obligatorios.' })
    }

    const calendarSnapshot = await adminDb.collection('calendars').doc(calendarId).get()
    if (!calendarSnapshot.data()?.memberIds?.includes(uid)) {
      return response.status(403).json({ error: 'No tienes acceso a este calendario.' })
    }

    const integrationRef = adminDb.collection('google_integrations').doc(uid)
    const integration = (await integrationRef.get()).data()
    const calendarMappingRef = integrationRef.collection('calendarMappings').doc(calendarId)
    const calendarMapping = (await calendarMappingRef.get()).data()
    if (!integration?.refreshToken || !calendarMapping?.googleCalendarId) {
      return response.status(409).json({ error: 'Este calendario todavía no está conectado con Google.' })
    }

    const googleCalendarId = calendarMapping.googleCalendarId as string
    const eventMappingRef = calendarMappingRef.collection('eventMappings').doc(eventId)
    const googleEventId = (await eventMappingRef.get()).data()?.googleEventId as string | undefined
    const calendarClient = createCalendarClient(integration.refreshToken)

    if (action === 'delete') {
      if (googleEventId) {
        try {
          await calendarClient.events.delete({ calendarId: googleCalendarId, eventId: googleEventId })
        } catch (error: any) {
          if (error?.code !== 404) throw error
        }
        await eventMappingRef.delete()
      }
      return response.status(200).json({ ok: true })
    }

    const eventDocument = await adminDb.collection('calendars').doc(calendarId).collection('events').doc(eventId).get()
    if (!eventDocument.exists) return response.status(404).json({ error: 'No encontramos el evento a sincronizar.' })
    const eventResource = buildGoogleEvent(eventDocument.data() || {})

    if (googleEventId) {
      await calendarClient.events.update({ calendarId: googleCalendarId, eventId: googleEventId, requestBody: eventResource })
    } else {
      const created = await calendarClient.events.insert({ calendarId: googleCalendarId, requestBody: eventResource })
      if (!created.data.id) throw new Error('Google Calendar no devolvió el identificador del evento.')
      await eventMappingRef.set({ googleEventId: created.data.id, eventPath: eventDocument.ref.path })
    }

    return response.status(200).json({ ok: true })
  } catch (error) {
    console.error('Google Calendar event sync failed', error)
    return response.status(500).json({ error: 'No se pudo sincronizar el evento con Google Calendar.' })
  }
}
