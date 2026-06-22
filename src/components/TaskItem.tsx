import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  updateTask,
  deleteTask,
  toggleTaskCompleted,
} from '../services/firestoreService'
import { priorityLabel } from '../utils/taskHelpers'
import { formatDate, toDateInputValue } from '../utils/format'
import type { Task, TaskFormValues } from '../types'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskFormValues['priority']>(
    task.priority,
  )
  const [dueDate, setDueDate] = useState('') // string "aaaa-mm-dd" o ""
  // busy bloquea los botones mientras hay una operación en curso, para
  // evitar doble click (ej: dos borrados o dos toggles seguidos).
  const [busy, setBusy] = useState(false)

  async function handleToggle() {
    setBusy(true)
    try {
      await toggleTaskCompleted(task.id, !task.completed)
      toast.success(
        task.completed ? 'Tarea marcada como pendiente.' : 'Tarea completada.',
      )
    } catch (err) {
      console.error('Error al actualizar tarea:', err)
      toast.error('No se pudo actualizar la tarea.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    // Confirmación previa para evitar borrados accidentales.
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return
    setBusy(true)
    try {
      await deleteTask(task.id)
      toast.success('Tarea eliminada.')
    } catch (err) {
      console.error('Error al eliminar tarea:', err)
      toast.error('No se pudo eliminar la tarea.')
    } finally {
      setBusy(false)
    }
  }

  function startEditing() {
    // Sincroniza el form de edición con los valores actuales de la tarea
    // (que pueden haber cambiado por un update en tiempo real desde el mount).
    setTitle(task.title)
    setDescription(task.description)
    setPriority(task.priority)
    setDueDate(task.dueDate ? toDateInputValue(task.dueDate) : '')
    setEditing(true)
  }

  function handlePriorityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setPriority(value === '' ? undefined : (value as TaskFormValues['priority']))
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('La tarea necesita un título.')
      return
    }
    setBusy(true)
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
      })
      toast.success('Tarea actualizada.')
      setEditing(false)
    } catch (err) {
      console.error('Error al actualizar tarea:', err)
      toast.error('No se pudo actualizar la tarea.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={handleSave}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Título"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Descripción"
          />
          <select
            value={priority ?? ''}
            onChange={handlePriorityChange}
            aria-label="Prioridad"
          >
            <option value="">Sin prioridad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Fecha de vencimiento"
          />
          <button type="submit" disabled={busy}>
            Guardar
          </button>
          <button type="button" onClick={cancelEditing} disabled={busy}>
            Cancelar
          </button>
        </form>
      </li>
    )
  }

  return (
    <li>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        disabled={busy}
        aria-label="Completada"
      />
      <strong
        style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
      >
        {task.title}
      </strong>
      {task.description && <p>{task.description}</p>}
      {task.priority && <span>Prioridad: {priorityLabel[task.priority]}</span>}
      {task.dueDate && <span>Vence: {formatDate(task.dueDate)}</span>}
      <button type="button" onClick={startEditing} disabled={busy}>
        Editar
      </button>
      <button type="button" onClick={handleDelete} disabled={busy}>
        Eliminar
      </button>
    </li>
  )
}
