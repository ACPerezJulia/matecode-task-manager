// Un mensaje del chat. 'user' = la usuaria, 'model' = Tyrion (Gemini).
// Mismo formato que espera la serverless function /api/chat.
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

/**
 * Manda el historial completo de la conversación a la function /api/chat
 * y devuelve la respuesta de Tyrion. El frontend nunca habla con Gemini
 * directamente: la API key vive en el servidor.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'No se pudo contactar al asistente.')
  }

  const data = (await res.json()) as { reply?: string }
  if (!data.reply) {
    throw new Error('El asistente no devolvió respuesta.')
  }
  return data.reply
}
