import type { Task } from '../types'

interface TodoListProps {
  tasks: Task[]
}

export function TodoList({ tasks }: TodoListProps) {
  if (tasks.length === 0) {
    return <p>Todavía no tenés tareas. Creá la primera arriba.</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <strong>{task.title}</strong>
          {task.description && <p>{task.description}</p>}
        </li>
      ))}
    </ul>
  )
}
