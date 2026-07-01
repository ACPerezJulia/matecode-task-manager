import { useState } from 'react'
import toast from 'react-hot-toast'
import { createTask } from '../services/firestoreService'
import { CustomSelect } from './CustomSelect'
import type { TaskFormValues } from '../types'

interface TodoFormProps {
  userId: string
  onSuccess?: () => void
  onCancel?: () => void
}

type TodoFormState = Omit<TaskFormValues, 'priority'> & {
  priority: TaskFormValues['priority'] | ''
  date: string
  time: string
}

const emptyForm = (): TodoFormState => ({
  title: '',
  description: '',
  priority: '',
  dueDate: '',
  label: '',
  date: '',
  time: '',
})

export function TodoForm({ userId, onSuccess, onCancel }: TodoFormProps) {
  const [form, setForm] = useState<TodoFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePriorityChange(value: string) {
    setForm((prev) => ({
      ...prev,
      priority: value as TaskFormValues['priority'] | '',
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
        priority: form.priority || undefined,
        dueDate,
        label: form.label?.trim() || undefined,
      })
      toast.success('Tarea creada.')
      setForm(emptyForm())
      onSuccess?.()
    } catch (err) {
      console.error('Error al crear tarea:', err)
      toast.error('No se pudo crear la tarea.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card task-panel" onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
      <p className="task-panel__heading">Nueva tarea</p>

      <label htmlFor="title" className="sr-only">Título</label>
      <input
        id="title"
        name="title"
        type="text"
        value={form.title}
        onChange={handleChange}
        placeholder="¿Qué tenés que hacer?"
        autoFocus
      />

      <label htmlFor="description" className="sr-only">Descripción</label>
      <textarea
        id="description"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descripción... ¡dame más detalles!"
        rows={2}
      />

      <p className="task-panel__optional-label">Opcionales</p>
      <div className="task-panel__meta">
        <div>
          <label id="tp-priority-label" className="task-panel__field-label">Prioridad</label>
          <CustomSelect
            aria-labelledby="tp-priority-label"
            value={form.priority ?? ''}
            onChange={handlePriorityChange}
            options={[
              { value: '', label: 'Sin prioridad' },
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
            ]}
          />
        </div>

        <div>
          <label className="task-panel__field-label" htmlFor="tp-date">Fecha</label>
          <input
            id="tp-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="task-panel__field-label" htmlFor="tp-time">Hora</label>
          <input
            id="tp-time"
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="task-panel__field-label" htmlFor="tp-label">Etiqueta</label>
          <input
            id="tp-label"
            name="label"
            type="text"
            value={form.label ?? ''}
            onChange={handleChange}
            placeholder="#Dev, #Personal..."
          />
        </div>
      </div>

      <div className="task-panel__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Creando...' : 'Agregar tarea'}
        </button>
      </div>
    </form>
  )
}
