import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

/**
 * Serverless function (Vercel) que envía por AWS SES un resumen de las
 * tareas del usuario. El frontend llama a POST /api/send-email; nunca
 * habla con AWS directamente, así las credenciales no salen del servidor.
 */

// Forma mínima de cada tarea que esperamos del frontend (no mandamos todo
// el objeto Task, solo lo que el email necesita).
interface TaskSummary {
  title: string
  completed: boolean
  // Fecha/hora de vencimiento YA formateada por el cliente (string legible),
  // o ausente si la tarea no tiene vencimiento. Ver nota de zona horaria en
  // emailService.ts: no formateamos acá porque la function corre en UTC.
  dueDate?: string
}

interface SendEmailBody {
  to?: string
  tasks?: TaskSummary[]
}

// Validación simple de email (mismo criterio que en los formularios).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Cliente SES creado una sola vez (se reutiliza entre invocaciones en caliente).
// Las credenciales salen de variables de entorno SIN prefijo VITE_, así que
// solo existen en el servidor y jamás llegan al navegador.
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Solo aceptamos POST (enviar un email cambia estado del mundo).
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' })
  }

  // 2. Validación del payload.
  const { to, tasks } = (req.body ?? {}) as SendEmailBody
  if (!to || !EMAIL_RE.test(to)) {
    return res.status(400).json({ error: 'Falta un email de destino válido.' })
  }
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'El campo "tasks" debe ser un array.' })
  }

  // El remitente tiene que estar configurado y verificado en SES.
  const fromEmail = process.env.SES_FROM_EMAIL
  if (!fromEmail) {
    // Es un error de configuración del servidor, no culpa del cliente.
    return res
      .status(500)
      .json({ error: 'SES_FROM_EMAIL no está configurado en el servidor.' })
  }

  // 3. Separamos en pendientes / completadas y armamos el cuerpo del mail.
  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)
  const { text, html } = buildSummary(pending, completed)

  // 4. Enviamos con SES.
  try {
    await ses.send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: {
            Data: 'Tu resumen de tareas — MateCode',
            Charset: 'UTF-8',
          },
          Body: {
            Text: { Data: text, Charset: 'UTF-8' },
            Html: { Data: html, Charset: 'UTF-8' },
          },
        },
      }),
    )
    return res.status(200).json({ ok: true })
  } catch (err) {
    // Logueamos el detalle real en el servidor, pero al cliente solo le
    // damos un mensaje genérico (no exponemos internals de AWS).
    console.error('Error al enviar email con SES:', err)
    return res.status(502).json({ error: 'No se pudo enviar el email.' })
  }
}

/** Escapa caracteres especiales para no romper (ni inyectar) HTML en el mail. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Construye las dos versiones del cuerpo: texto plano (fallback) y HTML. */
function buildSummary(pending: TaskSummary[], completed: TaskSummary[]) {
  // Tomamos el título de forma defensiva por si viniera vacío/indefinido.
  const titleOf = (t: TaskSummary) => String(t.title ?? '').trim() || '(sin título)'

  // URL de la app: configurable por env, con default a producción (es una URL
  // pública, no un secreto, así que el default está bien).
  const appUrl = process.env.APP_URL ?? 'https://matecode-task-manager.vercel.app'

  // --- Texto plano: para clientes de correo que no renderizan HTML ---
  // Cada línea muestra el título y, si la tarea tiene vencimiento, la fecha/hora.
  const lineOf = (t: TaskSummary) =>
    `- ${titleOf(t)}${t.dueDate ? ` (vence: ${t.dueDate})` : ''}`

  const text = [
    'Tu resumen de tareas',
    '',
    `Pendientes (${pending.length}):`,
    ...(pending.length ? pending.map(lineOf) : ['  (ninguna)']),
    '',
    `Completadas (${completed.length}):`,
    ...(completed.length ? completed.map(lineOf) : ['  (ninguna)']),
    '',
    `Abrí tus tareas en MateCode: ${appUrl}`,
  ].join('\n')

  // --- HTML simple ---
  const list = (items: TaskSummary[]) =>
    items.length
      ? `<ul>${items
          .map((t) => {
            const due = t.dueDate
              ? ` <span style="color: #666;">(vence: ${escapeHtml(t.dueDate)})</span>`
              : ''
            return `<li>${escapeHtml(titleOf(t))}${due}</li>`
          })
          .join('')}</ul>`
      : '<p><em>(ninguna)</em></p>'

  const html = `
    <div style="font-family: system-ui, sans-serif; color: #1a1a1a;">
      <h2>Tu resumen de tareas</h2>
      <h3>Pendientes (${pending.length})</h3>
      ${list(pending)}
      <h3>Completadas (${completed.length})</h3>
      ${list(completed)}
      <p style="margin-top: 24px;">
        <a href="${escapeHtml(appUrl)}"
           style="display: inline-block; padding: 10px 18px; background: #1a1a1a;
                  color: #fff; text-decoration: none; border-radius: 6px;">
          Abrir MateCode
        </a>
      </p>
    </div>
  `.trim()

  return { text, html }
}
