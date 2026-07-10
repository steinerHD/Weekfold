const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const db = admin.firestore();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function normalizeDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date(value);
}

function formatEventDate(value) {
  const date = normalizeDate(value);
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildReminderHtml(event, calendar, recipientEmail) {
  const start = formatEventDate(event.start);
  const end = formatEventDate(event.end);
  const title = event.title || 'Sin título';
  const description = event.description || 'Tu evento está listo para comenzar.';
  return `
    <div style="font-family:Inter, Arial, sans-serif; background:#f5f2ff; padding:24px; color:#1f2937;">
      <div style="max-width:640px; margin:0 auto; background:white; border-radius:24px; overflow:hidden; box-shadow:0 20px 50px rgba(79,70,229,0.12);">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:24px 28px; color:white;">
          <p style="margin:0 0 8px; font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.9;">Weekfold</p>
          <h1 style="margin:0; font-size:26px;">Recordatorio de evento</h1>
          <p style="margin:8px 0 0; opacity:0.95;">Tu evento empieza en 10 minutos.</p>
        </div>
        <div style="padding:28px;">
          <h2 style="margin:0 0 12px; font-size:22px; color:#111827;">${title}</h2>
          <p style="margin:0 0 8px; color:#4b5563;">Calendario: <strong>${calendar?.name || 'Sin nombre'}</strong></p>
          <p style="margin:0 0 8px; color:#4b5563;">Inicio: <strong>${start}</strong></p>
          <p style="margin:0 0 8px; color:#4b5563;">Fin: <strong>${end}</strong></p>
          <p style="margin:16px 0 0; color:#4b5563;">${description}</p>
          <p style="margin:16px 0 0; color:#6b7280;">Este correo se envió a <strong>${recipientEmail}</strong>.</p>
        </div>
      </div>
    </div>
  `;
}

exports.sendReminder = functions.region('southamerica-east1').runWith({ memory: '256MB', timeoutSeconds: 60 }).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const { calendarId, eventId, event, calendar, recipientEmail } = data;
  if (!calendarId || !eventId || !event || !calendar || !recipientEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos para enviar el recordatorio.');
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject: `Recordatorio: ${event.title}`,
      html: buildReminderHtml(event, calendar, recipientEmail),
    });

    return { ok: true };
  } catch (error) {
    console.error('sendReminder failed', error);
    throw new functions.https.HttpsError('internal', 'No se pudo enviar el correo.');
  }
});

exports.checkUpcomingEventReminders = functions.region('southamerica-east1').runWith({ memory: '256MB', timeoutSeconds: 120 }).pubsub.schedule('every 1 minutes').onRun(async () => {
  const now = new Date();
  const calendarsSnap = await db.collection('calendars').get();

  for (const calendarDoc of calendarsSnap.docs) {
    const calendarId = calendarDoc.id;
    const calendarData = calendarDoc.data();
    const eventsSnap = await db.collection('calendars').doc(calendarId).collection('events').get();

    for (const eventDoc of eventsSnap.docs) {
      const event = eventDoc.data();
      if (event.reminderSentAt) continue;

      const startDate = normalizeDate(event.start);
      if (!startDate || Number.isNaN(startDate.getTime())) continue;

      const diffMinutes = Math.round((startDate - now) / 60000);
      if (diffMinutes < 9 || diffMinutes > 11) continue;

      const recipientEmail = event.createdByEmail || calendarData.ownerEmail || null;
      if (!recipientEmail) continue;

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipientEmail,
          subject: `Recordatorio: ${event.title || 'Evento próximo'}`,
          html: buildReminderHtml(event, calendarData, recipientEmail),
        });

        await eventDoc.ref.update({
          reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
          reminderStatus: 'sent',
        });
      } catch (error) {
        console.error(`Reminder failed for ${eventDoc.id}`, error);
      }
    }
  }
});
