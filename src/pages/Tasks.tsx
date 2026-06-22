import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { TodoForm } from '../components/TodoForm'
import { TodoList } from '../components/TodoList'

export default function Tasks() {
  const { user, logout } = useAuth()
  const { tasks, loading } = useTasks(user?.uid)
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    toast.success('Sesión cerrada.')
    navigate('/login')
  }

  return (
    <main>
      <header>
        <h1>Mis tareas</h1>
        <p>
          Sesión iniciada como: <strong>{user?.email}</strong>
        </p>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {/* user existe siempre acá: Tasks vive dentro de ProtectedRoute */}
      {user && <TodoForm userId={user.uid} />}

      {loading ? <p>Cargando tareas...</p> : <TodoList tasks={tasks} />}
    </main>
  )
}
