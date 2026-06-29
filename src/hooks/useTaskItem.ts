import { useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  updateTask,
  toggleTaskCompleted,
} from '../services/firestoreService'
import { toDateInputValue } from '../utils/format'
import type { Task, TaskFormValues } from '../types'

/**
 * Lógica compartida de una tarea: completar, editar inline y borrar.
 * La usan TaskItem (lista) y TaskCard (grid) para NO duplicar el comportamiento.
 * Así cada vista solo se ocupa de CÓMO se ve; el "qué hace" vive acá.
 */
export function useTaskItem(task: Task) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<TaskFormValues['priority'] | ''>(
    task.priority ?? '',
  )
  const [dueDateStr, setDueDateStr] = useState('') // "aaaa-mm-dd" o ""
  const [dueTimeStr, setDueTimeStr] = useState('') // "hh:mm" o ""
  const [label, setLabel] = useState(task.label ?? '')
  // busy bloquea los botones mientras hay una operación en curso (evita doble click).
  const [busy, setBusy] = useState(false)

  async function toggle() {
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

  function startEditing() {
    // Sincroniza el form con los valores actuales de la tarea (que pueden haber
    // cambiado por un update en tiempo real desde el montaje).
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority ?? '')
    const rawDate = task.dueDate ? toDateInputValue(task.dueDate) : ''
    const [datePart = '', timePart = ''] = rawDate.split('T')
    setDueDateStr(datePart)
    setDueTimeStr(timePart)
    setLabel(task.label ?? '')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  function onPriorityChange(value: string) {
    setPriority(value as TaskFormValues['priority'] | '')
  }

  async function save(e: FormEvent) {
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
        priority: priority || undefined,
        dueDate: dueDateStr ? `${dueDateStr}T${dueTimeStr || '00:00'}` : undefined,
        label: label.trim() || undefined,
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

  return {
    editing,
    busy,
    toggle,
    startEditing,
    // Todo lo que necesita el form de edición, agrupado para pasarlo de una.
    edit: {
      taskId: task.id,
      title,
      setTitle,
      description,
      setDescription,
      priority,
      onPriorityChange,
      dueDateStr,
      setDueDateStr,
      dueTimeStr,
      setDueTimeStr,
      label,
      setLabel,
      save,
      cancel: cancelEditing,
      busy,
    },
  }
}

/** Estado/handlers del form de edición (lo que recibe TaskEditForm). */
export type TaskEditState = ReturnType<typeof useTaskItem>['edit']
