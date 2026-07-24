import { google } from 'googleapis'

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'

export function createGoogleOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Faltan variables de entorno de Google OAuth.')
  }

  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

export function createCalendarClient(refreshToken: string) {
  const oauth2Client = createGoogleOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}
