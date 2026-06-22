import type { Task, TaskFilter, TaskSort } from '../types'

/** Etiqueta legible para cada prioridad (para mostrar en la UI). */
export const priorityLabel: Record<NonNullable<Task['priority']>, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
}

// Peso de cada prioridad para ordenar: high primero.
const priorityRank: Record<NonNullable<Task['priority']>, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

/** Devuelve solo las tareas que coinciden con el filtro elegido. */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'pending':
      return tasks.filter((task) => !task.completed)
    case 'completed':
      return tasks.filter((task) => task.completed)
    case 'all':
    default:
      return tasks
  }
}

/**
 * Devuelve una copia ordenada de las tareas según el criterio elegido.
 * Trabaja sobre una copia porque Array.sort muta el array original.
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks]
  switch (sort) {
    case 'priority':
      // Las tareas sin prioridad se mandan al final (rank 3).
      return copy.sort((a, b) => {
        const ra = a.priority ? priorityRank[a.priority] : 3
        const rb = b.priority ? priorityRank[b.priority] : 3
        return ra - rb
      })
    case 'dueDate':
      // Las tareas sin fecha de vencimiento van al final.
      return copy.sort((a, b) => {
        const ta = a.dueDate ? a.dueDate.toMillis() : Infinity
        const tb = b.dueDate ? b.dueDate.toMillis() : Infinity
        return ta - tb
      })
    case 'recent':
    default:
      // Ya viene ordenado por createdAt desc desde Firestore.
      return copy
  }
}
