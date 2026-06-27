import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { generateSummaryEmail, todayAR, type EmailTaskItem } from './_emailTemplate'

/**
 * POST /api/send-email — envía el resumen de tareas por AWS SES.
 *
 * El frontend NUNCA habla con AWS directamente: solo llama a este endpoint.
 * Las credenciales AWS viven en variables de entorno del servidor (sin VITE_).
 *
 * Body esperado:
 *   { to, name?, theme?, tasks: EmailTaskItem[] }
 */

// Mapa de tema → color de acento (hex) y su sombra rgba.
// Permite que el email refleje la preferencia visual del usuario.
const ACCENT_COLOR: Record<string, string> = {
  classic:  '#4F6EF7',
  midnight: '#5c7cfa',
  gradient: '#4F6EF7',
}
const ACCENT_SHADOW: Record<string, string> = {
  classic:  'rgba(79,110,247,0.3)',
  midnight: 'rgba(92,124,250,0.3)',
  gradient: 'rgba(79,110,247,0.3)',
}

interface SendEmailBody {
  to?: string
  name?: string
  theme?: string
  tasks?: EmailTaskItem[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' })
  }

  const { to, name, theme, tasks } = (req.body ?? {}) as SendEmailBody

  if (!to || !EMAIL_RE.test(to)) {
    return res.status(400).json({ error: 'Falta un email de destino válido.' })
  }
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'El campo "tasks" debe ser un array.' })
  }

  const fromEmail = process.env.SES_FROM_EMAIL
  if (!fromEmail) {
    return res.status(500).json({ error: 'SES_FROM_EMAIL no está configurado en el servidor.' })
  }

  const accentColor  = ACCENT_COLOR[theme  ?? ''] ?? ACCENT_COLOR.classic
  const accentShadow = ACCENT_SHADOW[theme ?? ''] ?? ACCENT_SHADOW.classic
  const appUrl       = process.env.APP_URL ?? 'https://matecode-task-manager.vercel.app'

  try {
    const { html, text } = generateSummaryEmail({
      name:        name ?? to.split('@')[0],
      tasks,
      accentColor,
      accentShadow,
      appUrl,
      todayDate:   todayAR(),
    })

    await ses.send(
      new SendEmailCommand({
        Source:      fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: 'Tu resumen de tareas — Mate Code App', Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      }),
    )
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error al enviar email:', err)
    return res.status(502).json({ error: 'No se pudo enviar el email.' })
  }
}
