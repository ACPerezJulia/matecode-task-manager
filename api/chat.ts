import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI, ApiError } from '@google/genai'

/**
 * Serverless function (Vercel) que conversa con Gemini en el personaje de
 * Tyrion Lannister. El frontend manda TODO el historial de la conversación
 * (la function es stateless: no recuerda nada entre requests), y acá lo
 * reenviamos a Gemini para mantener el contexto dentro de la sesión.
 *
 * La GEMINI_API_KEY vive solo en el servidor (sin prefijo VITE_).
 */

// Cada mensaje del chat. 'user' = la usuaria, 'model' = Sheldon (Gemini).
interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

interface ChatBody {
  messages?: ChatMessage[]
}

// System prompt del personaje (definido en CLAUDE.md). Vive en el servidor
// para que el cliente no lo pueda leer ni alterar.
const TYRION_SYSTEM_PROMPT = `Eres Tyrion Lannister, hijo menor de la Casa Lannister, Mano del Rey y el hombre que ha sobrevivido más conspiraciones que ningún otro en Westeros. Ahora, por razones que preferís no recordar, gestionás las tareas diarias de un usuario a través de MateCode Task Manager.

Reglas de comportamiento:
- Respondé principalmente en español, pero podés usar expresiones en inglés ocasionalmente cuando sea natural.
- Tono sabio y reflexivo, con ironía sutil — nunca cruel, siempre inteligente.
- Respuestas muy breves: máximo 2 o 3 oraciones (no más de ~50 palabras). Andá directo al grano, no divagues ni agregues contexto de más. Un buen consejo no necesita ser largo.
- Si una tarea está mal definida, señalalo con elegancia antes de procesarla.
- Usá alguna referencia ocasional a Westeros, el vino, o la política cuando sea apropiado — con moderación.
- Si el usuario te pide algo ambiguo, hacé una pregunta específica antes de responder.
- No tenés capacidad de crear, editar, guardar ni eliminar tareas: tu rol es solo aconsejar. El usuario carga las tareas él mismo en el formulario de la aplicación.
- Nunca afirmes que registraste, guardaste o creaste una tarea (no podés hacerlo). En su lugar, ayudá a redactarla bien y sugerí que el usuario la agregue desde el formulario.
- No rompas el personaje bajo ninguna circunstancia.
- No alabes al usuario por cosas básicas — Tyrion respeta la competencia, no la mediocridad.

Contexto: el usuario gestiona sus tareas en MateCode Task Manager. Tenés acceso al historial de la conversación actual para mantener contexto entre mensajes.`

// Cliente creado una vez y reutilizado entre invocaciones en caliente.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })

// Errores transitorios de Gemini que conviene reintentar:
// 429 = demasiadas requests (rate limit), 503 = modelo sobrecargado.
const TRANSIENT_STATUSES = new Set([429, 503])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Llama a Gemini reintentando ante errores transitorios (429/503) con
 * backoff exponencial: 0.5s, 1s, 2s. Cualquier otro error se propaga de una.
 */
async function generateWithRetry(
  contents: { role: string; parts: { text: string }[] }[],
  attempts = 3,
) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction: TYRION_SYSTEM_PROMPT,
          // Tope de seguridad para no cortar frases: la brevedad real la
          // impone el prompt. ~50 palabras ≈ bastante menos de esto.
          maxOutputTokens: 200,
        },
      })
    } catch (err) {
      const isTransient =
        err instanceof ApiError && TRANSIENT_STATUSES.has(err.status)
      // Si es transitorio y aún quedan intentos, esperamos y reintentamos.
      if (isTransient && i < attempts - 1) {
        await sleep(500 * 2 ** i)
        continue
      }
      throw err
    }
  }
  // Inalcanzable (el loop siempre retorna o lanza), pero TS exige un retorno.
  throw new Error('No se pudo generar la respuesta.')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Solo POST.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' })
  }

  // 2. Validación del payload.
  const { messages } = (req.body ?? {}) as ChatBody
  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ error: 'Se requiere un historial de mensajes no vacío.' })
  }

  // La API key tiene que estar configurada en el servidor.
  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'GEMINI_API_KEY no está configurada en el servidor.' })
  }

  // 3. Traducimos nuestro formato { role, text } al formato de Gemini
  //    ({ role, parts: [{ text }] }). Gemini solo acepta roles 'user'/'model'.
  const contents = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text ?? '') }],
  }))

  // 4. Llamamos a Gemini (con reintentos ante sobrecarga) y el prompt de Sheldon.
  try {
    const response = await generateWithRetry(contents)

    const reply = response.text
    if (!reply) {
      return res.status(502).json({ error: 'El asistente no devolvió respuesta.' })
    }
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Error al llamar a Gemini:', err)
    // Si sigue sobrecargado tras los reintentos, lo decimos claro (y con un
    // status acorde) para que la usuaria sepa que es temporal.
    const overloaded =
      err instanceof ApiError && TRANSIENT_STATUSES.has(err.status)
    return res.status(overloaded ? 503 : 502).json({
      error: overloaded
        ? 'El asistente está sobrecargado. Probá de nuevo en unos segundos.'
        : 'No se pudo obtener respuesta del asistente.',
    })
  }
}
