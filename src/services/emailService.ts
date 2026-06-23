import type { Task } from '../types'

/**
 * Llama a la serverless function POST /api/send-email para que envíe por
 * AWS SES un resumen de tareas. El frontend NUNCA habla con AWS directamente:
 * solo conoce este endpoint propio, y las credenciales viven en el servidor.
 *
 * @param to    Email de destino (en sandbox debe ser una dirección verificada).
 * @param tasks Tareas a resumir. Mandamos solo lo que el email necesita.
 */
export async function sendTaskSummary(to: string, tasks: Task[]): Promise<void> {
  // Reducimos cada Task a { title, completed }: no tiene sentido mandar
  // Timestamps, ids ni userId al endpoint del email.
  const payload = {
    to,
    tasks: tasks.map((t) => ({ title: t.title, completed: t.completed })),
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
