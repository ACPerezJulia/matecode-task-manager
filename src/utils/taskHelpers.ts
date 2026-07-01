import type { Timestamp } from 'firebase/firestore'
import type { Task, TaskFilter, TaskSort } from '../types'

/** Etiqueta legible para cada prioridad (para mostrar en la UI). */
export const priorityLabel: Record<NonNullable<Task['priority']>, string> = {
  low: 'baja',
  medium: 'media',
  high: 'alta',
}

/** Estado de una fecha relativo a hoy, para el color semántico del chip/barra. */
export type DueStatus = 'overdue' | 'soon' | 'later'

/**
 * Devuelve el estado de la fecha de una tarea:
 * - 'overdue': fecha pasada y la tarea NO está completada (urgente → rojo)
 * - 'soon':    vence hoy o mañana (→ amarillo)
 * - 'later':   más de 2 días, o tarea completada (→ gris)
 *
 * Compara por DÍA (ignora la hora) en zona horaria local: "hoy" es hoy aunque
 * ya hayan pasado las horas. Una tarea completada nunca es urgente.
 */
export function getDueStatus(dueDate: Timestamp, completed: boolean): DueStatus {
  if (completed) return 'later'

  const due = dueDate.toDate()
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const msPerDay = 1000 * 60 * 60 * 24
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / msPerDay)

  if (diffDays < 0) return 'overdue'
  if (diffDays <= 1) return 'soon' // hoy (0) o mañana (1)
  return 'later'
}

/** Tono de color de la barra superior de una card del grid. */
export type BarTone = 'red' | 'yellow' | 'green' | 'grey'

/**
 * Color de la barra superior de la card:
 * - si hay prioridad, manda la prioridad (alta=rojo, media=amarillo, baja=verde)
 * - si no hay prioridad pero sí fecha, toma el color del estado de la fecha
 * - si no hay ni prioridad ni fecha, gris
 */
export function getCardBarTone(task: Task): BarTone {
  // Vencida siempre alerta en rojo, por encima de cualquier prioridad
  if (task.dueDate && getDueStatus(task.dueDate, task.completed) === 'overdue') return 'red'
  if (task.priority === 'high') return 'red'
  if (task.priority === 'medium') return 'yellow'
  if (task.priority === 'low') return 'green'
  if (task.dueDate && getDueStatus(task.dueDate, task.completed) === 'soon') return 'yellow'
  return 'grey'
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
