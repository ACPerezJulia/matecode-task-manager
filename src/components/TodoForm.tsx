import { useState } from 'react'
import toast from 'react-hot-toast'
import { createTask } from '../services/firestoreService'
import type { TaskFormValues } from '../types'

interface TodoFormProps {
  userId: string
}

const emptyForm: TaskFormValues = { title: '', description: '' }

export function TodoForm({ userId }: TodoFormProps) {
  const [form, setForm] = useState<TaskFormValues>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validación: el título no puede estar vacío.
    if (!form.title.trim()) {
      toast.error('La tarea necesita un título.')
      return
    }

    setSubmitting(true)
    try {
      await createTask(userId, {
        title: form.title.trim(),
        description: form.description.trim(),
      })
      toast.success('Tarea creada.')
      setForm(emptyForm) // limpia el form tras crear
    } catch (err) {
      console.error('Error al crear tarea:', err)
      toast.error('No se pudo crear la tarea.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">Título</label>
      <input
        id="title"
        name="title"
        type="text"
        value={form.title}
        onChange={handleChange}
      />
      <label htmlFor="description">Descripción</label>
      <textarea
        id="description"
        name="description"
        value={form.description}
        onChange={handleChange}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creando...' : 'Agregar tarea'}
      </button>
    </form>
  )
}
