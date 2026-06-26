import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * Serverless function (Vercel) que envía por AWS SES un resumen de las
 * tareas del usuario. El frontend llama a POST /api/send-email; nunca
 * habla con AWS directamente, así las credenciales no salen del servidor.
 */

interface TaskSummary {
  title: string
  description?: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string  // ya formateado por el cliente (dd/mm/aa o dd/mm/aa HH:mm)
  status?: 'overdue' | 'soon' | 'later'  // solo para tareas pendientes
}

interface SendEmailBody {
  to?: string
  tasks?: TaskSummary[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' })
  }

  const { to, tasks } = (req.body ?? {}) as SendEmailBody
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

  const { text, html } = buildEmail(tasks, to)

  try {
    await ses.send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: 'Tu resumen de tareas — MateCode', Charset: 'UTF-8' },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      }),
    )
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error al enviar email con SES:', err)
    return res.status(502).json({ error: 'No se pudo enviar el email.' })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Argentina es UTC-3 y no usa DST, así que el ajuste manual es exacto.
function todayAR(): string {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const d = String(ar.getUTCDate()).padStart(2, '0')
  const m = String(ar.getUTCMonth() + 1).padStart(2, '0')
  const y = String(ar.getUTCFullYear()).slice(-2)
  return `${d}/${m}/${y}`
}

const PRIORITY_CFG = {
  high:   { label: 'ALTA',  color: '#ef4444', bg: '#ef444420' },
  medium: { label: 'MEDIA', color: '#f59e0b', bg: '#f59e0b20' },
  low:    { label: 'BAJA',  color: '#22c55e', bg: '#22c55e20' },
} as const

function priorityBadge(p?: TaskSummary['priority']): string {
  if (!p) return ''
  const { label, color, bg } = PRIORITY_CFG[p]
  return `<span style="font-size:10px;background:${bg};color:${color};padding:2px 7px;border-radius:999px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>`
}

function dateChip(date: string, chipColor: string, chipBg: string): string {
  return `<span style="font-size:10px;background:${chipBg};color:${chipColor};padding:3px 8px;border-radius:999px;font-weight:600;">${escapeHtml(date)}</span>`
}

// Genera una card de tarea para las secciones Vencidas o Pendientes.
function pendingCard(task: TaskSummary, sectionBg: string, sectionBorder: string): string {
  const title = escapeHtml(String(task.title ?? '').trim() || '(sin título)')
  const desc = task.description?.trim()
    ? `<p style="margin:4px 0 0;font-size:11px;color:#7b7b9a;">${escapeHtml(task.description)}</p>`
    : ''
  // Chip de fecha: rojo para vencidas, amarillo para próximas, gris para el resto.
  let chip = ''
  if (task.dueDate) {
    if (task.status === 'overdue') chip = dateChip(task.dueDate, '#ef4444', '#ef444420')
    else if (task.status === 'soon') chip = dateChip(task.dueDate, '#f59e0b', '#f59e0b20')
    else chip = dateChip(task.dueDate, '#a8a8c0', '#ffffff10')
  }
  const badge = priorityBadge(task.priority)

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
  <tr>
    <td style="background:${sectionBg};border:1px solid ${sectionBorder};border-radius:10px;padding:12px 14px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;font-weight:600;color:#e8e8f0;">${title}</p>
            ${desc}
          </td>
          ${chip ? `<td align="right" style="vertical-align:top;padding-left:12px;white-space:nowrap;">${chip}</td>` : ''}
        </tr>
        ${badge ? `<tr><td colspan="2" style="padding-top:8px;">${badge}</td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`
}

// Card para tareas completadas: tachada, atenuada, ✅ a la derecha.
function completedCard(task: TaskSummary): string {
  const title = escapeHtml(String(task.title ?? '').trim() || '(sin título)')
  // Muestra descripción si tiene; si no, la fecha como contexto.
  const sub = task.description?.trim()
    ? `<p style="margin:4px 0 0;font-size:11px;color:#5a5a7a;">${escapeHtml(task.description)}</p>`
    : task.dueDate
    ? `<p style="margin:4px 0 0;font-size:11px;color:#5a5a7a;">${escapeHtml(task.dueDate)}</p>`
    : ''

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
  <tr>
    <td style="background:#22c55e08;border:1px solid #22c55e20;border-radius:10px;padding:12px 14px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;font-weight:600;color:#7b7b9a;text-decoration:line-through;">${title}</p>
            ${sub}
          </td>
          <td align="right" style="vertical-align:top;padding-left:12px;">
            <span style="font-size:16px;">✅</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

function htmlSection(emoji: string, label: string, color: string, cards: string, topPad = '16px'): string {
  return `
          <tr>
            <td style="background:#1a1a24;padding:${topPad} 32px 8px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${color};">${emoji} ${label}</p>
              ${cards}
            </td>
          </tr>`
}

// ---------------------------------------------------------------------------
// buildEmail — arma el cuerpo completo del email (texto plano + HTML)
// ---------------------------------------------------------------------------

function buildEmail(tasks: TaskSummary[], to: string): { text: string; html: string } {
  const appUrl = process.env.APP_URL ?? 'https://matecode-task-manager.vercel.app'
  const generatedAt = todayAR()

  const overdueTasks  = tasks.filter(t => !t.completed && t.status === 'overdue')
  const soonTasks     = tasks.filter(t => !t.completed && t.status === 'soon')
  const laterTasks    = tasks.filter(t => !t.completed && (t.status === 'later' || !t.dueDate))
  const completedTasks = tasks.filter(t => t.completed)
  const allPending = [...overdueTasks, ...soonTasks, ...laterTasks]

  // --- Texto plano (fallback para clientes sin soporte HTML) ---
  const lineOf = (t: TaskSummary) =>
    `- ${String(t.title ?? '').trim() || '(sin título)'}${t.dueDate ? ` (${t.dueDate})` : ''}`

  const text = [
    'Tu resumen de tareas — MateCode',
    `Generado el ${generatedAt}`,
    '',
    ...(overdueTasks.length ? [`⚠ Vencidas (${overdueTasks.length}):`, ...overdueTasks.map(lineOf), ''] : []),
    ...(soonTasks.length   ? [`🕐 Próximas (${soonTasks.length}):`,    ...soonTasks.map(lineOf),    ''] : []),
    `Pendientes (${allPending.length}):`,
    ...(allPending.length ? allPending.map(lineOf) : ['  (ninguna)']),
    '',
    `Completadas (${completedTasks.length}):`,
    ...(completedTasks.length ? completedTasks.map(lineOf) : ['  (ninguna)']),
    '',
    `Abrí tus tareas en MateCode: ${appUrl}`,
  ].join('\n')

  // --- HTML ---
  const overdueCards  = overdueTasks.map(t => pendingCard(t, '#ef444410', '#ef444430')).join('')
  const pendingCards  = [
    ...soonTasks.map(t  => pendingCard(t, '#a855f710', '#a855f730')),
    ...laterTasks.map(t => pendingCard(t, '#a855f710', '#a855f730')),
  ].join('')
  const completedCards = completedTasks.map(completedCard).join('')

  const statCell = (n: number, label: string, color: string) => `
                  <td align="center" style="padding:0 8px;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:${color};">${n}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#7b7b9a;text-transform:uppercase;letter-spacing:0.06em;">${label}</p>
                  </td>`
  const divider = `<td style="width:1px;background:#2e2e45;"></td>`

  // La primera sección de contenido lleva más padding superior (24px vs 16px).
  const firstSection = overdueTasks.length ? 'overdue' : allPending.length ? 'pending' : 'completed'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MateCode — Resumen de tareas</title>
</head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a24;border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:1px solid #2e2e45;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#a855f7;">MateCode Task Manager</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#e8e8f0;letter-spacing:-0.02em;">Tu resumen de tareas</h1>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="font-size:28px;">📋</span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#7b7b9a;">
                Generado el <strong style="color:#a8a8c0;">${generatedAt}</strong> · ${escapeHtml(to)}
              </p>
            </td>
          </tr>

          <!-- Stats -->
          <tr>
            <td style="background:#16161f;padding:20px 32px;border-bottom:1px solid #2e2e45;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${statCell(overdueTasks.length,   'Vencidas',    '#ef4444')}
                  ${divider}
                  ${statCell(soonTasks.length,      'Próximas',    '#f59e0b')}
                  ${divider}
                  ${statCell(allPending.length,     'Pendientes',  '#a855f7')}
                  ${divider}
                  ${statCell(completedTasks.length, 'Completadas', '#22c55e')}
                </tr>
              </table>
            </td>
          </tr>

          ${overdueTasks.length   ? htmlSection('⚠', 'Vencidas',    '#ef4444', overdueCards,  firstSection === 'overdue'   ? '24px' : '16px') : ''}
          ${allPending.length     ? htmlSection('●', 'Pendientes',  '#a855f7', pendingCards,  firstSection === 'pending'   ? '24px' : '16px') : ''}
          ${completedTasks.length ? htmlSection('✓', 'Completadas', '#22c55e', completedCards, firstSection === 'completed' ? '24px' : '16px') : ''}

          <!-- CTA -->
          <tr>
            <td style="background:#1a1a24;padding:24px 32px;border-radius:0 0 16px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#a855f7;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:10px;letter-spacing:0.01em;">Abrir MateCode →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:10px;color:#4a4a6a;text-align:center;">
                MateCode Task Manager · Este es un resumen automático generado por vos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { text, html }
}
