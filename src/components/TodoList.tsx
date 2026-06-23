import { TaskItem } from './TaskItem'
import type { Task } from '../types'

interface TodoListProps {
  tasks: Task[]
}

export function TodoList({ tasks }: TodoListProps) {
  if (tasks.length === 0) {
    return <p className="empty">No hay tareas que coincidan con el filtro.</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
