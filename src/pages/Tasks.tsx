import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { TodoForm } from '../components/TodoForm'
import { TodoList } from '../components/TodoList'
import { TaskListSkeleton } from '../components/Skeleton'
import { filterTasks, sortTasks } from '../utils/taskHelpers'
import { sendTaskSummary } from '../services/emailService'
import type { TaskFilter, TaskSort } from '../types'

export default function Tasks() {
  const { user, logout } = useAuth()
  const { tasks, loading } = useTasks(user?.uid)
  const navigate = useNavigate()

  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('recent')
  // Bloquea el botón de "enviar resumen" mientras la request está en curso.
  const [sending, setSending] = useState(false)

  // Filtrado y orden en cliente: sobre las tareas ya traídas, en memoria.
  const visibleTasks = sortTasks(filterTasks(tasks, filter), sort)

  async function handleLogout() {
    await logout()
    toast.success('Sesión cerrada.')
    navigate('/login')
  }

  async function handleSendSummary() {
    if (!user?.email) return
    setSending(true)
    try {
      // toast.promise muestra los 3 estados (cargando/éxito/error) en una
      // sola llamada. El mensaje de error sale del Error que lanza el service.
      await toast.promise(sendTaskSummary(user.email, tasks), {
        loading: 'Enviando resumen...',
        success: 'Resumen enviado a tu email.',
        error: (err: Error) => err.message,
      })
    } catch {
      // toast.promise ya mostró el error; el catch solo evita el
      // "unhandled promise rejection" cuando el envío falla.
    } finally {
      setSending(false)
    }
  }

  return (
    <main>
      <header className="app-header">
        <h1>Mis tareas</h1>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleSendSummary}
          disabled={sending || tasks.length === 0}
        >
          {sending ? 'Enviando...' : 'Enviarme el resumen'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
        <p className="app-header__user">
          Sesión iniciada como: <strong>{user?.email}</strong>
        </p>
      </header>

      {/* user existe siempre acá: Tasks vive dentro de ProtectedRoute */}
      {user && <TodoForm userId={user.uid} />}

      {loading ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        // Caso "no hay ninguna tarea": invitamos a crear la primera.
        <p className="empty">Todavía no tenés tareas. Creá la primera arriba.</p>
      ) : (
        <>
          <div className="controls">
            <span>Filtrar: </span>
            <button
              type="button"
              className="chip"
              onClick={() => setFilter('all')}
              disabled={filter === 'all'}
            >
              Todas
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setFilter('pending')}
              disabled={filter === 'pending'}
            >
              Pendientes
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => setFilter('completed')}
              disabled={filter === 'completed'}
            >
              Completadas
            </button>
          </div>

          <div className="controls">
            <label htmlFor="sort">Ordenar por: </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as TaskSort)}
            >
              <option value="recent">Más recientes</option>
              <option value="priority">Prioridad</option>
              <option value="dueDate">Fecha de vencimiento</option>
            </select>
          </div>

          <TodoList tasks={visibleTasks} />
        </>
      )}
    </main>
  )
}
