export async function syncEventWithGoogle(currentUser, calendarId, eventId, action) {
  if (!currentUser || !eventId) return

  try {
    const idToken = await currentUser.getIdToken()
    const response = await fetch('/api/sync-event', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ calendarId, eventId, action }),
    })

    // La integración es opcional: guardar en Weekfold no debe fallar si la
    // persona todavía no conectó su cuenta de Google Calendar.
    if (response.status === 409) return
    if (!response.ok) throw new Error(`Google Calendar respondió ${response.status}`)
  } catch (error) {
    console.warn('Google Calendar sync failed', error)
  }
}
