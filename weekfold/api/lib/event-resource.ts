function toDateTime(value: any) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('El evento tiene una fecha inválida.')
  return date.toISOString()
}

export function buildGoogleEvent(event: Record<string, any>) {
  const resource: Record<string, any> = {
    summary: event.title || 'Sin título',
    description: event.description || '',
    start: { dateTime: toDateTime(event.start), timeZone: 'America/Bogota' },
    end: { dateTime: toDateTime(event.end), timeZone: 'America/Bogota' },
  }

  if (event.recurrence?.enabled) {
    let rule = 'RRULE:FREQ=WEEKLY'
    if (event.recurrence.until) {
      rule += `;UNTIL=${toDateTime(event.recurrence.until).replace(/[-:]/g, '').replace('.000', '')}`
    }
    resource.recurrence = [rule]
  }

  return resource
}
