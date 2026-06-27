import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * POST /api/send-email — envía el resumen de tareas por AWS SES.
 *
 * El frontend NUNCA habla con AWS directamente: solo llama a este endpoint.
 * Las credenciales AWS viven en variables de entorno del servidor (sin VITE_).
 *
 * Body esperado:
 *   { to, name?, theme?, tasks: EmailTaskItem[] }
 */

// ---------------------------------------------------------------------------
// Tipos del payload
// ---------------------------------------------------------------------------

interface EmailTaskItem {
  title: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  label?: string
  description?: string
}

interface SendEmailBody {
  to?: string
  name?: string
  theme?: string
  tasks?: EmailTaskItem[]
}

// ---------------------------------------------------------------------------
// Mapa de tema → color de acento
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Template HTML + generación del email
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function todayAR(): string {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const MONTHS = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ]
  return `${ar.getUTCDate()} de ${MONTHS[ar.getUTCMonth()]} de ${ar.getUTCFullYear()}`
}

function buildTaskCard(
  task: EmailTaskItem,
  cardBg: string,
  cardBorder: string,
  sideColor: string,
  accentColor: string,
): string {
  const title = escapeHtml(task.title.trim() || '(sin título)')

  const dateChip = task.dueDate
    ? `<span style="font-size:11px;color:#6b7280;background:#f0f4ff;padding:2px 8px;border-radius:20px;border:1px solid #e2e8f0;margin-right:6px;">&#x1F4C5; ${escapeHtml(task.dueDate)}</span>`
    : ''

  const labelChip = task.label
    ? `<span style="font-size:11px;color:${accentColor};background:#eef2ff;padding:2px 8px;border-radius:20px;border:1px solid #c7d2fe;font-weight:600;">#${escapeHtml(task.label)}</span>`
    : ''

  const chips = dateChip || labelChip
    ? `<div style="margin-top:5px;">${dateChip}${labelChip}</div>`
    : ''

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
  <tr>
    <td style="background:${cardBg};border-radius:10px;border:1px solid ${cardBorder};padding:12px 14px;box-shadow:inset 4px 0 0 ${sideColor};">
      <div style="font-size:14px;font-weight:600;color:#1e2140;">${title}</div>
      ${chips}
    </td>
  </tr>
</table>`
}

function buildPrioritySection(
  label: string,
  dotColor: string,
  textColor: string,
  cardBg: string,
  cardBorder: string,
  sideColor: string,
  tasks: EmailTaskItem[],
  accentColor: string,
): string {
  if (!tasks.length) return ''

  const cards = tasks
    .map(t => buildTaskCard(t, cardBg, cardBorder, sideColor, accentColor))
    .join('')

  return `
<div style="margin-bottom:20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="vertical-align:middle;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:8px;vertical-align:middle;"></span>
        <span style="font-size:13px;font-weight:700;color:${textColor};text-transform:uppercase;letter-spacing:0.6px;vertical-align:middle;">${label}</span>
      </td>
    </tr>
  </table>
  ${cards}
</div>`
}

const TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Tu resumen de tareas - Mate Code App</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Outfit',system-ui,sans-serif;">

  <div style="display:none;font-size:1px;color:#f0f4ff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    PENDING_COUNT tareas pendientes para hoy - Mate Code App
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <tr>
            <td style="background:linear-gradient(135deg,#3b56e8 0%,ACCENT_COLOR 55%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.18);border-radius:16px;border:1.5px solid rgba(255,255,255,0.3);display:inline-block;text-align:center;line-height:56px;margin-bottom:16px;">
                <span style="color:#ffffff;font-weight:800;font-size:20px;letter-spacing:-0.5px;">MC</span>
              </div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;">Mate Code App</div>
              <div style="color:rgba(255,255,255,0.72);font-size:14px;font-weight:500;">Tu resumen diario de tareas</div>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:28px 28px 0;">

              <div style="font-size:24px;font-weight:800;color:#1e2140;letter-spacing:-0.5px;margin-bottom:6px;">
                Hola, NAME
              </div>
              <div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">TODAY_DATE</div>
              <div style="font-size:15px;color:#4f5882;line-height:1.6;margin-bottom:24px;">
                Ac&aacute; est&aacute; tu resumen de tareas para hoy. Ten&eacute;s
                <strong style="color:ACCENT_COLOR;">PENDING_COUNT tareas pendientes</strong>
                &mdash; &iexcl;dale que se puede!
              </div>

              <div style="height:1px;background:#f0f4ff;margin:0 0 20px;"></div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td width="32%" style="text-align:center;padding:14px 8px;background:#f5f7ff;border-radius:12px;border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:ACCENT_COLOR;line-height:1;">PENDING_COUNT</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Pendientes</div>
                  </td>
                  <td width="4%"></td>
                  <td width="32%" style="text-align:center;padding:14px 8px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
                    <div style="font-size:26px;font-weight:800;color:#16a34a;line-height:1;">COMPLETED_COUNT</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Completadas</div>
                  </td>
                  <td width="4%"></td>
                  <td width="32%" style="text-align:center;padding:14px 8px;background:#f5f7ff;border-radius:12px;border:1px solid #e2e8f0;">
                    <div style="font-size:26px;font-weight:800;color:#1e2140;line-height:1;">PROGRESS%</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:4px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Progreso</div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:12px;font-weight:600;color:#4f5882;">Progreso general</td>
                    <td align="right" style="font-size:12px;font-weight:700;color:ACCENT_COLOR;">PROGRESS%</td>
                  </tr>
                </table>
                <div style="background:#eef2ff;border-radius:100px;height:8px;overflow:hidden;border:1px solid #e2e8f0;margin-top:8px;">
                  <div style="height:100%;background:linear-gradient(90deg,ACCENT_COLOR,#7c3aed);width:PROGRESS%;border-radius:100px;"></div>
                </div>
              </div>

              <div style="height:1px;background:#f0f4ff;margin:0 0 20px;"></div>

              HIGH_SECTION
              MED_SECTION
              LOW_SECTION

              <div style="text-align:center;padding:24px 0 28px;">
                <a href="APP_URL" style="display:inline-block;background:linear-gradient(135deg,ACCENT_COLOR,#7c3aed);padding:14px 36px;border-radius:14px;color:#ffffff;font-size:15px;font-weight:700;letter-spacing:-0.2px;text-decoration:none;box-shadow:0 4px 20px ACCENT_SHADOW;">
                  Ver todas mis tareas &rarr;
                </a>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background:#f5f7ff;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;padding:20px 24px;text-align:center;">
              <div style="font-size:12px;color:#9ca3af;line-height:1.8;">
                Enviado desde <span style="color:ACCENT_COLOR;font-weight:600;">Mate Code App</span> &middot; TODAY_DATE<br>
                <a href="APP_URL" style="color:#9ca3af;text-decoration:underline;">Ir a la app</a>
              </div>
              <div style="margin-top:12px;font-size:11px;color:#c4cce8;">
                &copy; 2026 Mate Code App &middot; Hecho con amor por el equipo MateCode
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

function generateSummaryEmail(data: {
  name: string
  tasks: EmailTaskItem[]
  accentColor: string
  accentShadow: string
  appUrl: string
  todayDate: string
}): { html: string; text: string } {
  const { name, tasks, accentColor, accentShadow, appUrl, todayDate } = data

  const pending   = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)

  const highTasks = pending.filter(t => t.priority === 'high')
  const medTasks  = pending.filter(t => t.priority === 'medium')
  const lowTasks  = pending.filter(t => t.priority === 'low' || !t.priority)

  const progress = tasks.length > 0
    ? Math.round((completed.length / tasks.length) * 100)
    : 0

  const highSection = buildPrioritySection(
    'Prioridad Alta', '#dc2626', '#dc2626', '#fef9f9', '#fecaca', '#dc2626',
    highTasks, accentColor,
  )
  const medSection = buildPrioritySection(
    'Prioridad Media', '#d97706', '#d97706', '#fffdf5', '#fde68a', '#d97706',
    medTasks, accentColor,
  )
  const lowSection = buildPrioritySection(
    'Prioridad Baja', '#16a34a', '#16a34a', '#f8fffe', '#bbf7d0', '#16a34a',
    lowTasks, accentColor,
  )

  const html = TEMPLATE
    .replaceAll('ACCENT_COLOR', accentColor)
    .replaceAll('ACCENT_SHADOW', accentShadow)
    .replaceAll('NAME', escapeHtml(name))
    .replaceAll('TODAY_DATE', escapeHtml(todayDate))
    .replaceAll('PENDING_COUNT', String(pending.length))
    .replaceAll('COMPLETED_COUNT', String(completed.length))
    .replaceAll('PROGRESS', String(progress))
    .replaceAll('APP_URL', escapeHtml(appUrl))
    .replace('HIGH_SECTION', highSection)
    .replace('MED_SECTION', medSection)
    .replace('LOW_SECTION', lowSection)

  const lineOf = (t: EmailTaskItem) =>
    `- ${t.title.trim() || '(sin título)'}${t.dueDate ? ` (${t.dueDate})` : ''}${t.label ? ` [#${t.label}]` : ''}`

  const text = [
    'Tu resumen de tareas - Mate Code App',
    `Generado el ${todayDate}`,
    '',
    `Hola, ${name}! Tenés ${pending.length} pendientes · ${completed.length} completadas · ${progress}% de progreso.`,
    '',
    ...(highTasks.length ? ['PRIORIDAD ALTA:', ...highTasks.map(lineOf), ''] : []),
    ...(medTasks.length  ? ['PRIORIDAD MEDIA:', ...medTasks.map(lineOf),  ''] : []),
    ...(lowTasks.length  ? ['PRIORIDAD BAJA / SIN PRIORIDAD:', ...lowTasks.map(lineOf), ''] : []),
    `Ver tus tareas: ${appUrl}`,
  ].join('\n')

  return { html, text }
}

// ---------------------------------------------------------------------------
// SES client
// ---------------------------------------------------------------------------

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

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
    return res.status(503).json({ error: 'Servicio de email no disponible.' })
  }

  const accentColor  = ACCENT_COLOR[theme  ?? ''] ?? ACCENT_COLOR.classic
  const accentShadow = ACCENT_SHADOW[theme ?? ''] ?? ACCENT_SHADOW.classic
  const appUrl       = process.env.APP_URL ?? 'https://matecode-task-manager.vercel.app'

  try {
    const { html, text } = generateSummaryEmail({
      name:      name ?? to.split('@')[0],
      tasks,
      accentColor,
      accentShadow,
      appUrl,
      todayDate: todayAR(),
    })

    await ses.send(
      new SendEmailCommand({
        Source:      fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: 'Tu resumen de tareas - Mate Code App', Charset: 'UTF-8' },
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
