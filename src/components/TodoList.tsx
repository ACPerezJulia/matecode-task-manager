import { TaskItem } from './TaskItem'
import type { Task } from '../types'

interface TodoListProps {
  tasks: Task[]
}

export function TodoList({ tasks }: TodoListProps) {
  if (tasks.length === 0) {
    return <p>No hay tareas que coincidan con el filtro.</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
