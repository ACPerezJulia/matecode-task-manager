import { useState, useRef, useEffect } from 'react'
import { useTaskItem } from '../hooks/useTaskItem'
import { TaskEditForm } from './TaskEditForm'
import { TaskCheck } from './TaskCheck'
import { DueChip } from './DueChip'
import { TaskActions } from './TaskActions'
import { priorityLabel, getCardBarTone } from '../utils/taskHelpers'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const item = useTaskItem(task)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)

  // Detecta si el texto está realmente truncado comparando altura visible vs real.
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

  const tone = getCardBarTone(task)

  return (
    <li
      className={`task-card card task-card--bar-${tone}${
        task.completed ? ' is-completed' : ''
      }`}
    >
      <div className="task-card__head">
        <TaskCheck
          checked={task.completed}
          onChange={item.toggle}
          disabled={item.busy}
        />
        <strong className={`task-title${task.completed ? ' is-completed' : ''}`}>
          {task.title}
        </strong>
        {task.priority && (
          <span className={`badge badge--${task.priority} task-card__priority-badge`}>
            {priorityLabel[task.priority]}
          </span>
        )}
      </div>

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

      {task.dueDate && (
        <div className="task-card__meta">
          <DueChip dueDate={task.dueDate} completed={task.completed} />
        </div>
      )}

      <TaskActions
        onEdit={item.startEditing}
        onDelete={item.remove}
        disabled={item.busy}
      />
    </li>
  )
}
