import { formatDateForEmail } from '../utils/format'
import type { Task } from '../types'

/**
 * Llama a la serverless function POST /api/send-email para que envíe por
 * AWS SES un resumen de tareas. El frontend NUNCA habla con AWS directamente:
 * solo conoce este endpoint propio, y las credenciales viven en el servidor.
 *
 * @param to    Email de destino (en sandbox debe ser una dirección verificada).
 * @param tasks Tareas a resumir.
 * @param opts  Nombre del usuario y tema actual para personalizar el email.
 */
export async function sendTaskSummary(
  to: string,
  tasks: Task[],
  opts?: { name?: string; theme?: string },
): Promise<void> {
  // OJO con la zona horaria: formateamos dueDate ACÁ (cliente) y mandamos el
  // string ya listo. La Vercel Function corre en UTC y mostraría la hora corrida.
  const payload = {
    to,
    name:  opts?.name,
    theme: opts?.theme,
    tasks: tasks.map((t) => ({
      title:     t.title,
      description: t.description || undefined,
      completed: t.completed,
      priority:  t.priority,
      dueDate:   t.dueDate ? formatDateForEmail(t.dueDate) : undefined,
      label:     t.label   || undefined,
    })),
  }

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    // El handler responde { error: string } cuando algo falla.
    // Si ni siquiera viene JSON, caemos a un mensaje genérico.
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'No se pudo enviar el email.')
  }
}
