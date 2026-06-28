import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../hooks/useTheme'
import { useViewMode } from '../hooks/useViewMode'
import { TaskModal } from '../components/TaskModal'
import { TaskGrid } from '../components/TaskGrid'
import { TodoList } from '../components/TodoList'
import { TodoForm } from '../components/TodoForm'
import { ViewToggle } from '../components/ViewToggle'
import { TaskListSkeleton } from '../components/Skeleton'
import { EmailSendAnimation } from '../components/EmailSendAnimation'
import { filterTasks, sortTasks } from '../utils/taskHelpers'
import { sendTaskSummary } from '../services/emailService'
import { saveUserProfile } from '../services/firestoreService'
import type { TaskFilter, TaskSort, Theme } from '../types'

export default function Tasks() {
  const { user, logout } = useAuth()
  const { tasks, loading } = useTasks(user?.uid)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const { view, setView } = useViewMode()
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('recent')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view === 'grid' && e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !showModal) {
        setShowModal(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal, view])

  const effectiveView: 'list' | 'grid' = isMobile ? 'grid' : view
  const visibleTasks = sortTasks(filterTasks(tasks, filter), sort)

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'tú'
  const avatarInitial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
  const completedCount = tasks.filter((t) => t.completed).length
  const pendingCount = tasks.length - completedCount
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  async function handleLogout() {
    await logout()
    toast.success('Sesión cerrada.')
    navigate('/login')
  }

  function handleThemeChange(t: Theme) {
    setTheme(t)
    if (user) {
      saveUserProfile(user.uid, { theme: t }).catch(console.error)
    }
  }

  async function handleSendSummary() {
    if (!user?.email) return
    setIsSendingEmail(true)

    // Promesa de tiempo mínimo para que se complete la animación del sobre volando
    const minAnimationTimer = new Promise((resolve) => setTimeout(resolve, 2900))

    // Petición real al backend
    const emailRequest = sendTaskSummary(user.email, tasks, { name: firstName, theme })

    try {
      await Promise.all([minAnimationTimer, emailRequest])
      toast.success('¡Resumen enviado! Revisá tu email 📬')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar el resumen')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <main>
      {/* ── Header sticky ── */}
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">MC</span>
          <span className="app-header__name">Mate Code App</span>
        </div>

        <div className={`header-secondary${menuOpen ? ' is-open' : ''}`}>
          <div className="theme-toggle">
            <button
              type="button"
              className={`theme-toggle__btn${theme === 'classic' ? ' is-active' : ''}`}
              onClick={() => handleThemeChange('classic')}
              title="Clásico"
            >☀️</button>
            <button
              type="button"
              className={`theme-toggle__btn${theme === 'midnight' ? ' is-active' : ''}`}
              onClick={() => handleThemeChange('midnight')}
              title="Nocturno"
            >🌙</button>
            <button
              type="button"
              className={`theme-toggle__btn${theme === 'gradient' ? ' is-active' : ''}`}
              onClick={() => handleThemeChange('gradient')}
              title="Vívido"
            >✨</button>
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleSendSummary}
            disabled={tasks.length === 0 || isSendingEmail}
            title="Recibir un resumen de tareas por email"
          >
            ✉️ Resumen
          </button>

          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="app-header__avatar" title={user?.displayName ?? user?.email ?? ''}>
          {user?.photoURL
            ? <img src={user.photoURL} alt={user.displayName ?? 'Avatar'} className="app-header__avatar-img" referrerPolicy="no-referrer" />
            : avatarInitial}
        </div>

        <button
          type="button"
          className="header-hamburger"
          onClick={() => setMenuOpen(m => !m)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {menuOpen && (
          <div className="header-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}
      </header>

      {/* ── Bienvenida + stats ── */}
      <section className="welcome-section">
        <h1>Hola, {firstName} 👋</h1>
        <p className="welcome-section__sub">
          {pendingCount} pendientes · {completedCount} completadas
        </p>
        {tasks.length > 0 && (
          <div className="stats-cards">
            <div className="stat-card stat-card--pending">
              <span className="stat-card__value">{pendingCount}</span>
              <span className="stat-card__label">Pendientes</span>
            </div>
            <div className="stat-card stat-card--done">
              <span className="stat-card__value">{completedCount}</span>
              <span className="stat-card__label">Completadas</span>
            </div>
            <div className="stat-card stat-card--progress">
              <span className="stat-card__value">{progressPct}%</span>
              <span className="stat-card__label">Progreso</span>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Toolbar: vista · filtros · orden · acción ── */}
      {!loading && (
        <div className="controls-bar">
          {/* Grupo 1: toggle de vista (oculto en mobile via CSS) */}
          <div className="controls-bar__group controls-bar__group--view">
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Grupos 2 y 3: solo cuando hay tareas */}
          {tasks.length > 0 && (
            <>
              <div className="controls-bar__group controls-bar__group--filters">
                <div className="filter-group">
                  <button type="button" className="chip" disabled={filter === 'pending'} onClick={() => setFilter('pending')}>Pendientes</button>
                  <button type="button" className="chip" disabled={filter === 'completed'} onClick={() => setFilter('completed')}>Completadas</button>
                  <button type="button" className="chip" disabled={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
                </div>
                <select
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as TaskFilter)}
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>

              <div className="controls-bar__group controls-bar__group--sort">
                <div className="sort-group">
                  <span className="sort-group__label">Ordenar por</span>
                  <select
                    className="sort-group__select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as TaskSort)}
                  >
                    <option value="recent">Recientes</option>
                    <option value="priority">Prioridad</option>
                    <option value="dueDate">Fecha</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Grupo 4: acción siempre visible */}
          <div className="controls-bar__group controls-bar__group--action">
            <button
              type="button"
              className={`btn ${isFormOpen && effectiveView === 'list' ? 'btn--ghost' : 'btn--primary'}`}
              onClick={() => {
                if (effectiveView === 'grid') setShowModal(true)
                else setIsFormOpen((f) => !f)
              }}
            >
              {isFormOpen && effectiveView === 'list' ? '× Cancelar' : 'Nueva tarea'}
            </button>
          </div>
        </div>
      )}

      {/* ── Panel inline de nueva tarea (modo lista) ── */}
      {!loading && effectiveView === 'list' && isFormOpen && user && (
        <TodoForm
          userId={user.uid}
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* ── Contenido principal ── */}
      {loading ? (
        <TaskListSkeleton />
      ) : effectiveView === 'list' ? (
        <TodoList tasks={visibleTasks} />
      ) : tasks.length === 0 ? (
        <p className="empty">Todavía no tenés tareas. ¡Usá "Nueva tarea" para crear la primera!</p>
      ) : (
        <TaskGrid tasks={visibleTasks} />
      )}

      {/* FAB: solo en modo grid, acceso rápido al scrollear lejos de los controles */}
      {effectiveView === 'grid' && (
        <button
          type="button"
          className="fab"
          onClick={() => setShowModal(true)}
          aria-label="Nueva tarea"
        >
          +
        </button>
      )}

      {/* Modal para crear tarea (solo modo grid) */}
      {user && showModal && (
        <TaskModal userId={user.uid} onClose={() => setShowModal(false)} />
      )}


      {isSendingEmail && <EmailSendAnimation />}

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Desarrollado por Analía Pérez Juliá · Todos los derechos reservados</p>
      </footer>
    </main>
  )
}
