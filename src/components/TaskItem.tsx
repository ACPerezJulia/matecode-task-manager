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
    if (!description.trim()) {
      toast.error('La tarea necesita una descripción.')
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
      <li className="task-item card">
        <form className="task-form" onSubmit={handleSave}>
          <div>
            <label htmlFor={`edit-title-${task.id}`}>Título</label>
            <input
              id={`edit-title-${task.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Título"
            />
          </div>
          <div>
            <label htmlFor={`edit-desc-${task.id}`}>Descripción</label>
            <textarea
              id={`edit-desc-${task.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Descripción"
            />
          </div>
          <div className="form-row">
            <div>
              <label htmlFor={`edit-prio-${task.id}`}>Prioridad</label>
              <select
                id={`edit-prio-${task.id}`}
                value={priority ?? ''}
                onChange={handlePriorityChange}
                aria-label="Prioridad"
              >
                <option value="">Sin prioridad</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label htmlFor={`edit-due-${task.id}`}>Fecha y hora</label>
              <input
                id={`edit-due-${task.id}`}
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Fecha y hora"
              />
            </div>
          </div>
          <div className="task-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              Guardar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={cancelEditing}
              disabled={busy}
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="task-item card">
      <div className="task-item__head">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          disabled={busy}
          aria-label="Completada"
        />
        <strong className={`task-title${task.completed ? ' is-completed' : ''}`}>
          {task.title}
        </strong>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      {(task.priority || task.dueDate) && (
        <div className="task-meta">
          {task.priority && (
            <span className={`badge badge--${task.priority}`}>
              {priorityLabel[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <span className="task-due">{formatDate(task.dueDate)}</span>
          )}
        </div>
      )}
      <div className="task-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={startEditing}
          disabled={busy}
          aria-label="Editar tarea"
          title="Editar tarea"
        >
          {/* Ícono de lápiz (SVG inline, stroke estilo Feather) */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={handleDelete}
          disabled={busy}
          aria-label="Eliminar tarea"
          title="Eliminar tarea"
        >
          {/* Ícono de tacho (SVG inline, stroke estilo Feather) */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </li>
  )
}
