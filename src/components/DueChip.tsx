import { getDueStatus } from '../utils/taskHelpers'
import { formatDateOnly } from '../utils/format'
import type { Timestamp } from 'firebase/firestore'

interface DueChipProps {
  dueDate: Timestamp
  completed: boolean
}

const TONE_CLASS = {
  overdue: 'due-chip--red',
  soon: 'due-chip--yellow',
  later: 'due-chip--grey',
} as const

/**
 * Chip de fecha con color semántico (rojo vencida / amarillo hoy-mañana / gris lejana).
 * Muestra solo la fecha — la hora se muestra en un chip separado en TaskCard.
 */
export function DueChip({ dueDate, completed }: DueChipProps) {
  const status = getDueStatus(dueDate, completed)

  return (
    <span className={`due-chip ${TONE_CLASS[status]}`}>
      📅 {formatDateOnly(dueDate)}
    </span>
  )
}
