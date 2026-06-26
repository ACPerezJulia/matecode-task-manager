import { useTaskItem } from '../hooks/useTaskItem'
import { TaskEditForm } from './TaskEditForm'
import { TaskCheck } from './TaskCheck'
import { DueChip } from './DueChip'
import { TaskActions } from './TaskActions'
import { priorityLabel, getCardBarTone } from '../utils/taskHelpers'
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
}

/**
 * Vista LISTA de una tarea. Solo presentación: la lógica (toggle/editar/borrar)
 * vive en useTaskItem, y el form de edición + el check + el chip de fecha + los
 * botones son piezas compartidas con la vista grid (TaskCard).
 */
export function TaskItem({ task }: TaskItemProps) {
  const item = useTaskItem(task)

  if (item.editing) {
    return (
      <li className="task-item card">
        <TaskEditForm edit={item.edit} />
      </li>
    )
  }

  const tone = getCardBarTone(task)

  return (
    <li className={`task-item card task-item--bar-${tone}${task.completed ? ' is-completed' : ''}`}>
      <div className="task-item__head">
        <TaskCheck
          checked={task.completed}
          onChange={item.toggle}
          disabled={item.busy}
        />
        <strong className={`task-title${task.completed ? ' is-completed' : ''}`}>
          {task.title}
        </strong>
        {task.dueDate && (
          <DueChip dueDate={task.dueDate} completed={task.completed} />
        )}
        {task.priority && (
          <span className={`badge badge--${task.priority} task-card__priority-badge`}>
            {priorityLabel[task.priority]}
          </span>
        )}
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      <TaskActions
        onEdit={item.startEditing}
        onDelete={item.remove}
        disabled={item.busy}
      />
    </li>
  )
}
