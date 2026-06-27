import { useState, useRef, useEffect } from 'react'
import { useTaskItem } from '../hooks/useTaskItem'
import { TaskEditForm } from './TaskEditForm'
import { TaskCheck } from './TaskCheck'
import { DueChip } from './DueChip'
import { priorityLabel, getCardBarTone, type BarTone } from '../utils/taskHelpers'

const TONE_COLOR: Record<BarTone, string> = {
  red:    'var(--prio-high)',
  yellow: 'var(--prio-medium)',
  green:  'var(--prio-low)',
  grey:   'var(--border)',
}
import { formatTimeOnly } from '../utils/format'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const item = useTaskItem(task)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = descRef.current
    if (!el || expanded) return
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [task.description, expanded])

  if (item.editing) {
    return (
      <li className="task-card card">
        <TaskEditForm edit={item.edit} />
      </li>
    )
  }

  const priorityColor = TONE_COLOR[getCardBarTone(task)]
  const timeStr = task.dueDate ? formatTimeOnly(task.dueDate) : null

  return (
    <li
      className={`task-card card${task.completed ? ' is-completed' : ''}`}
      style={{ boxShadow: `inset 4px 0 0 ${priorityColor}, 0 2px 16px rgba(0,0,0,0.4)` }}
    >
      {/* × arriba / ✏ abajo — absolutos en esquina superior derecha */}
      <div className="task-card__actions">
        <button
          type="button"
          className="task-card__btn task-card__btn--del"
          onClick={item.remove}
          disabled={item.busy}
          aria-label="Eliminar tarea"
          title="Eliminar tarea"
        >
          ×
        </button>
        <button
          type="button"
          className="task-card__btn"
          onClick={item.startEditing}
          disabled={item.busy}
          aria-label="Editar tarea"
          title="Editar tarea"
        >
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
      </div>

      {/* Checkbox + columna de contenido (título y descripción alineados) */}
      <div className="task-card__head">
        <TaskCheck
          checked={task.completed}
          onChange={item.toggle}
          disabled={item.busy}
        />
        <div className="task-card__content">
          <strong className={`task-title${task.completed ? ' is-completed' : ''}`}>
            {task.title}
          </strong>

          {task.description && (
            <p
              ref={descRef}
              className={[
                'task-card__desc',
                expanded ? 'is-expanded' : '',
                isClamped ? 'task-card__desc--expandable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={isClamped || expanded ? () => setExpanded((e) => !e) : undefined}
            >
              {task.description}
              {isClamped && !expanded && (
                <span className="task-card__desc-more"> ver más</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Footer: prioridad (dot) + fecha + hora + etiqueta */}
      {(task.priority || task.dueDate || task.label) && (
        <div className="task-card__footer">
          {task.priority && (
            <span className={`badge badge--dot badge--${task.priority}`}>
              {priorityLabel[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <DueChip dueDate={task.dueDate} completed={task.completed} />
          )}
          {timeStr && (
            <span className="time-chip">⏰ {timeStr}</span>
          )}
          {task.label && <span className="label-chip">#{task.label}</span>}
        </div>
      )}
    </li>
  )
}
