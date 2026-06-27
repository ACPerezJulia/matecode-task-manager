import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../hooks/useTheme'
import { TaskModal } from '../components/TaskModal'
import { TaskGrid } from '../components/TaskGrid'
import { TaskListSkeleton } from '../components/Skeleton'
import { TyrionChat } from '../components/TyrionChat'
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

  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('recent')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
            📧 Resumen
          </button>

          <button type="button" className="btn btn--ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="app-header__avatar" title={user?.displayName ?? user?.email ?? ''}>
          {avatarInitial}
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
            </div>
          </div>
        )}
        {tasks.length > 0 && (
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </section>

      {/* ── Barra de filtros + orden + nueva tarea ── */}
      {!loading && tasks.length > 0 && (
        <div className="controls-bar">
          {/* Filtros en grupo pill */}
          <div className="filter-group">
            <button type="button" className="chip" disabled={filter === 'pending'} onClick={() => setFilter('pending')}>Pendientes</button>
            <button type="button" className="chip" disabled={filter === 'completed'} onClick={() => setFilter('completed')}>Completadas</button>
            <button type="button" className="chip" disabled={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
          </div>

          <div className="controls-bar__sep" />

          <div className="controls-bar__sort">
            <button type="button" className="chip" disabled={sort === 'recent'} onClick={() => setSort('recent')}>Recientes</button>
            <button type="button" className="chip" disabled={sort === 'priority'} onClick={() => setSort('priority')}>Prioridad</button>
            <button type="button" className="chip" disabled={sort === 'dueDate'} onClick={() => setSort('dueDate')}>Fecha</button>
          </div>

          <div className="controls-bar__end">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setShowModal(true)}
            >
              + Nueva tarea
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      {loading ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        <>
          <p className="empty">Todavía no tenés tareas. ¡Creá la primera!</p>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
              + Nueva tarea
            </button>
          </div>
        </>
      ) : (
        <TaskGrid tasks={visibleTasks} />
      )}

      {/* FAB: acceso rápido cuando se scrolleó lejos de los controles */}
      <button
        type="button"
        className="fab"
        onClick={() => setShowModal(true)}
        aria-label="Nueva tarea"
      >
        +
      </button>

      {/* Modal para crear tarea */}
      {user && showModal && (
        <TaskModal userId={user.uid} onClose={() => setShowModal(false)} />
      )}

      <TyrionChat />

      {isSendingEmail && <EmailSendAnimation />}
    </main>
  )
}
