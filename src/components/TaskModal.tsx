import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { createTask } from '../services/firestoreService'
import type { TaskFormValues } from '../types'

interface TaskModalProps {
  userId: string
  onClose: () => void
}

const empty = (): TaskFormValues & { date: string; time: string } => ({
  title: '',
  description: '',
  priority: undefined,
  dueDate: '',
  label: '',
  date: '',
  time: '',
})

export function TaskModal({ userId, onClose }: TaskModalProps) {
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function togglePriority(p: TaskFormValues['priority']) {
    setForm((prev) => ({
      ...prev,
      priority: prev.priority === p ? undefined : p,
    }))
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error('La tarea necesita un título.')
      return
    }
    if (!form.description.trim()) {
      toast.error('La tarea necesita una descripción.')
      return
    }
    setSubmitting(true)
    try {
      const dueDate = form.date
        ? `${form.date}T${form.time || '00:00'}`
        : undefined
      await createTask(userId, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate,
        label: form.label?.trim() || undefined,
      })
      toast.success('Tarea creada.')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo crear la tarea.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleContainerKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleSubmit()
  }

  return (
    <div
      className="task-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nueva tarea"
    >
      <div
        className="task-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleContainerKey}
      >
        <div className="task-modal__header">
          <div>
            <h2 className="task-modal__title">Nueva tarea</h2>
            <p className="task-modal__hint">Ctrl+Enter para crear rápido</p>
          </div>
          <button
            type="button"
            className="task-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="task-modal__body">
          <input
            id="modal-title"
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="¿Qué tenés que hacer?"
          />

          <textarea
            id="modal-desc"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción... ¡dame más detalles!"
          />

          <p className="task-modal__optional-label">Opcionales</p>

          <div className="task-modal__field">
            <span>Prioridad</span>
            <div className="pri-btns">
              <button
                type="button"
                className={`pri-btn pri-btn--low${form.priority === 'low' ? ' is-active' : ''}`}
                onClick={() => togglePriority('low')}
              >
                🟢 Baja
              </button>
              <button
                type="button"
                className={`pri-btn pri-btn--medium${form.priority === 'medium' ? ' is-active' : ''}`}
                onClick={() => togglePriority('medium')}
              >
                🟡 Media
              </button>
              <button
                type="button"
                className={`pri-btn pri-btn--high${form.priority === 'high' ? ' is-active' : ''}`}
                onClick={() => togglePriority('high')}
              >
                🔴 Alta
              </button>
            </div>
          </div>

          <div className="task-modal__meta-grid">
            <div className="task-modal__field">
              <label htmlFor="modal-date">Fecha</label>
              <input
                id="modal-date"
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('date', e.target.value)}
              />
            </div>
            <div className="task-modal__field">
              <label htmlFor="modal-time">Hora</label>
              <input
                id="modal-time"
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
              />
            </div>
            <div className="task-modal__field">
              <label htmlFor="modal-label">Etiqueta</label>
              <input
                id="modal-label"
                type="text"
                value={form.label ?? ''}
                onChange={(e) => set('label', e.target.value)}
                placeholder="#Trabajo, #Personal, Dev..."
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary task-modal__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Creando...' : 'Crear tarea →'}
          </button>
        </div>
      </div>
    </div>
  )
}
