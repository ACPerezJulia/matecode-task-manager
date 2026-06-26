import { getDueStatus } from '../utils/taskHelpers'
import { formatDate } from '../utils/format'
import type { Timestamp } from 'firebase/firestore'

interface DueChipProps {
  dueDate: Timestamp
  completed: boolean
}

// Estado de la fecha -> clase de color. Reloj (urgente) para hoy/mañana o
// vencida; calendario para fechas lejanas.
const TONE_CLASS = {
  overdue: 'due-chip--red',
  soon: 'due-chip--yellow',
  later: 'due-chip--grey',
} as const

/**
 * Chip de fecha con color semántico (rojo vencida / amarillo hoy-mañana /
 * gris lejana) e ícono. Se usa en lista y en grid.
 */
export function DueChip({ dueDate, completed }: DueChipProps) {
  const status = getDueStatus(dueDate, completed)
  const urgent = status === 'overdue' || status === 'soon'

  return (
    <span className={`due-chip ${TONE_CLASS[status]}`}>
      {urgent ? <ClockIcon /> : <CalendarIcon />}
      {formatDate(dueDate)}
    </span>
  )
}

/** Ícono de reloj (fechas urgentes), estilo Feather. */
function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

/** Ícono de calendario (fechas lejanas), estilo Feather. */
function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
