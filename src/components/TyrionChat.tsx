import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { sendChatMessage, type ChatMessage } from '../services/chatService'

/**
 * Panel de chat flotante con el asistente Tyrion (Gemini).
 * El historial vive en estado de React: es memoria de SESIÓN (se reinicia
 * al recargar la página), tal como pide la consigna.
 */
export function TyrionChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Ancla al final de la lista para autoscrollear al último mensaje.
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    // Agregamos el mensaje del usuario y mandamos TODO el historial
    // (incluido el nuevo) para que Tyrion tenga contexto.
    const userMsg: ChatMessage = { role: 'user', text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    try {
      const reply = await sendChatMessage(history)
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error del asistente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat">
      {open && (
        <div className="chat-panel card" role="dialog" aria-label="Asistente Tyrion">
          <div className="chat-header">
            <strong>Tyrion</strong>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-hint">
                Soy Tyrion Lannister. Decime qué necesitás organizar — y procurá
                ser claro: en Westeros, la ambigüedad cuesta cabezas.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg--model chat-msg--typing">
                Pensando...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta..."
              aria-label="Mensaje"
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !input.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle btn btn--primary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? 'Cerrar' : '💬 Asistente'}
      </button>
    </div>
  )
}
