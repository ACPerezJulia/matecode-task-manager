import { useState } from 'react'
import toast from 'react-hot-toast'
import { createTask } from '../services/firestoreService'
import type { TaskFormValues } from '../types'

interface TodoFormProps {
  userId: string
}

const emptyForm: TaskFormValues = {
  title: '',
  description: '',
  priority: undefined,
  dueDate: '',
}

export function TodoForm({ userId }: TodoFormProps) {
  const [form, setForm] = useState<TaskFormValues>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // "" en el select significa "sin prioridad" -> lo guardamos como undefined
    // para que el campo opcional no exista en Firestore.
    const value = e.target.value
    setForm((prev) => ({
      ...prev,
      priority: value === '' ? undefined : (value as TaskFormValues['priority']),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      await createTask(userId, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        // "" -> undefined para no guardar una fecha vacía
        dueDate: form.dueDate || undefined,
      })
      toast.success('Tarea creada.')
      setForm(emptyForm)
    } catch (err) {
      console.error('Error al crear tarea:', err)
      toast.error('No se pudo crear la tarea.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* Prioridad y fecha: apiladas en mobile, lado a lado en tablet+ */}
      <div className="form-row">
        <div>
          <label htmlFor="priority">Prioridad</label>
          <select
            id="priority"
            name="priority"
            value={form.priority ?? ''}
            onChange={handlePriorityChange}
          >
            <option value="">Sin prioridad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <small className="field-hint">
            Opcional. Elegí alta, media o baja según la urgencia.
          </small>
        </div>

        <div>
          <label htmlFor="dueDate">Fecha y hora</label>
          <input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            value={form.dueDate ?? ''}
            onChange={handleChange}
          />
          <small className="field-hint">
            Opcional. El día y, si corresponde, la hora de la actividad.
          </small>
        </div>
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Creando...' : 'Agregar tarea'}
      </button>
    </form>
  )
}
