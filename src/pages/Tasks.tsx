import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useTheme } from '../hooks/useTheme'
import { useViewMode } from '../hooks/useViewMode'
import { TodoForm } from '../components/TodoForm'
import { TaskGrid } from '../components/TaskGrid'
import { TodoList } from '../components/TodoList'
import { ViewToggle } from '../components/ViewToggle'
import { CustomSelect } from '../components/CustomSelect'
import { TaskListSkeleton } from '../components/Skeleton'
import { EmailSendAnimation } from '../components/EmailSendAnimation'
import { HelpModal } from '../components/HelpModal'
import { IconMail, IconHelp, IconSun, IconMoon, IconSparkles, IconLogout, IconSearch, IconX, IconListCheck, IconClock, IconCircleCheck } from '@tabler/icons-react'
import { filterTasks, sortTasks } from '../utils/taskHelpers'
import { sendTaskSummary } from '../services/emailService'
import { deleteCompletedTasks, deleteTask } from '../services/firestoreService'
import { saveUserProfile } from '../services/firestoreService'
import type { TaskFilter, TaskSort, Theme, Task } from '../types'

function getDynamicSubtitle(
  tasks: Task[],
  pendingCount: number,
  completedCount: number,
  progressPct: number,
): string | null {
  if (tasks.length === 0) return null
  const todayStr = new Date().toDateString()
  const dueTodayCount = tasks.filter(
    t => !t.completed && t.dueDate && t.dueDate.toDate().toDateString() === todayStr
  ).length
  if (dueTodayCount > 0) return `Tenés ${dueTodayCount} tarea${dueTodayCount > 1 ? 's' : ''} para hoy`
  if (progressPct === 100) return '¡Todo listo! Gran día 🎉'
  if (progressPct >= 70) return '¡Casi terminás, vas muy bien!'
  if (progressPct >= 30) return 'Vas bien, seguí así 💪'
  if (pendingCount > 0 && completedCount === 0) return '¡A arrancar!'
  return null
}

export default function Tasks() {
  const { user, logout } = useAuth()
  const { tasks, loading } = useTasks(user?.uid)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const { view, setView } = useViewMode()
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('recent')
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !showModal) {
        setShowModal(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  const effectiveView: 'list' | 'grid' = isMobile ? 'grid' : view
  const activeTasks = tasks.filter((t) => !pendingDeletes.has(t.id))
  const visibleTasks = sortTasks(filterTasks(activeTasks, filter), sort)
  const filteredTasks = searchQuery.trim()
    ? visibleTasks.filter(t => {
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
        const q = norm(searchQuery)
        return (
          norm(t.title).includes(q) ||
          norm(t.description ?? '').includes(q) ||
          norm(t.label ?? '').includes(q)
        )
      })
    : visibleTasks

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'tú'
  const avatarInitial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
  const completedCount = activeTasks.filter((t) => t.completed).length
  const pendingCount = activeTasks.length - completedCount
  const progressPct = activeTasks.length > 0 ? Math.round((completedCount / activeTasks.length) * 100) : 0
  const dynamicSubtitle = getDynamicSubtitle(activeTasks, pendingCount, completedCount, progressPct)

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

  function handleDeleteRequest(task: Task) {
    const timerId = setTimeout(async () => {
      try {
        await deleteTask(task.id)
      } catch {
        toast.error('No se pudo eliminar la tarea.')
      } finally {
        setPendingDeletes((prev) => {
          const next = new Map(prev)
          next.delete(task.id)
          return next
        })
      }
    }, 5000)

    setPendingDeletes((prev) => new Map(prev).set(task.id, timerId))

    toast(
      (t) => (
        <div className="toast-undo">
          <span>Tarea eliminada.</span>
          <button
            type="button"
            className="toast-undo__btn"
            onClick={() => {
              clearTimeout(timerId)
              setPendingDeletes((prev) => {
                const next = new Map(prev)
                next.delete(task.id)
                return next
              })
              toast.dismiss(t.id)
            }}
          >
            Deshacer
          </button>
        </div>
      ),
      { duration: 5000 },
    )
  }

  function handleDeleteCompleted() {
    const ids = tasks.filter((t) => t.completed).map((t) => t.id)
    if (ids.length === 0) return

    const timerId = setTimeout(async () => {
      try {
        await deleteCompletedTasks(ids)
      } catch {
        toast.error('No se pudieron eliminar las tareas.')
      } finally {
        setPendingDeletes((prev) => {
          const next = new Map(prev)
          ids.forEach(id => next.delete(id))
          return next
        })
      }
    }, 10000)

    setPendingDeletes((prev) => {
      const next = new Map(prev)
      ids.forEach(id => next.set(id, timerId))
      return next
    })

    toast(
      (t) => (
        <div className="toast-undo">
          <span>{ids.length} tarea{ids.length > 1 ? 's' : ''} completada{ids.length > 1 ? 's' : ''} eliminada{ids.length > 1 ? 's' : ''}.</span>
          <button
            type="button"
            className="toast-undo__btn"
            onClick={() => {
              clearTimeout(timerId)
              setPendingDeletes((prev) => {
                const next = new Map(prev)
                ids.forEach(id => next.delete(id))
                return next
              })
              toast.dismiss(t.id)
            }}
          >
            Deshacer
          </button>
        </div>
      ),
      { duration: 10000 },
    )
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

        {/* Theme toggle — centrado en desktop, se oculta en mobile (está en el menú) */}
        <div className="theme-toggle theme-toggle--center">
          <button
            type="button"
            className={`theme-toggle__btn${theme === 'classic' ? ' is-active' : ''}`}
            onClick={() => handleThemeChange('classic')}
            title="Clásico"
          ><IconSun size={18} /></button>
          <button
            type="button"
            className={`theme-toggle__btn${theme === 'midnight' ? ' is-active' : ''}`}
            onClick={() => handleThemeChange('midnight')}
            title="Nocturno"
          ><IconMoon size={18} /></button>
          <button
            type="button"
            className={`theme-toggle__btn${theme === 'gradient' ? ' is-active' : ''}`}
            onClick={() => handleThemeChange('gradient')}
            title="Vívido"
          ><IconSparkles size={18} /></button>
        </div>

        {/* Botón de email — solo desktop, fuera del menú */}
        <button
          type="button"
          className="btn btn--ghost header-email-desktop"
          onClick={handleSendSummary}
          disabled={tasks.length === 0 || isSendingEmail}
          title="Enviar resumen por email"
        >
          <IconMail size={18} /> Enviar resumen
        </button>

        {/* Menú desplegable */}
        <div className={`header-secondary${menuOpen ? ' is-open' : ''}`}>
          <div className="header-profile">
            <div className="header-profile__avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt={user.displayName ?? 'Avatar'} className="app-header__avatar-img" referrerPolicy="no-referrer" />
                : avatarInitial}
            </div>
            <span className="header-profile__email">{user?.email}</span>
          </div>

          <button
            type="button"
            className="btn btn--ghost header-email-menu"
            onClick={() => { handleSendSummary(); setMenuOpen(false) }}
            disabled={tasks.length === 0 || isSendingEmail}
          >
            <IconMail size={18} /> Enviar resumen
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => { setShowHelp(true); setMenuOpen(false) }}
          >
            <IconHelp size={18} /> Instrucciones de uso
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--danger"
            onClick={handleLogout}
          >
            <IconLogout size={18} /> Cerrar sesión
          </button>
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
        {dynamicSubtitle && (
          <p className="welcome-section__sub">{dynamicSubtitle}</p>
        )}
        {tasks.length > 0 && (
          <>
          <div className="stats-cards">
            <button
              type="button"
              className={`stat-card stat-card--total${filter === 'all' ? ' is-active' : ''}`}
              onClick={() => setFilter('all')}
              aria-label="Ver todas las tareas"
              aria-pressed={filter === 'all'}
              title="Total de tareas"
            >
              <span className="stat-card__value">{activeTasks.length}</span>
              <span className="stat-card__label">
                <IconListCheck size={14} aria-hidden="true" />
                <span className="stat-card__label-text">Total</span>
              </span>
            </button>
            <button
              type="button"
              className={`stat-card stat-card--pending${filter === 'pending' ? ' is-active' : ''}`}
              onClick={() => setFilter('pending')}
              aria-label="Ver tareas pendientes"
              aria-pressed={filter === 'pending'}
              title="Tareas pendientes"
            >
              <span className="stat-card__value">{pendingCount}</span>
              <span className="stat-card__label">
                <IconClock size={14} aria-hidden="true" />
                <span className="stat-card__label-text">Pendientes</span>
              </span>
            </button>
            <button
              type="button"
              className={`stat-card stat-card--done${filter === 'completed' ? ' is-active' : ''}`}
              onClick={() => setFilter('completed')}
              aria-label="Ver tareas completadas"
              aria-pressed={filter === 'completed'}
              title="Tareas completadas"
            >
              <span className="stat-card__value">{completedCount}</span>
              <span className="stat-card__label">
                <IconCircleCheck size={14} aria-hidden="true" />
                <span className="stat-card__label-text">Completadas</span>
              </span>
            </button>
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
          <div className="stats-progress-mobile" aria-hidden="true">
            <div className="stats-progress-mobile__bar">
              <div className="stats-progress-mobile__fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="stats-progress-mobile__pct">{progressPct}%</span>
          </div>
          </>
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
              <div className="controls-bar__group controls-bar__group--search">
                <div className="search-bar">
                  <IconSearch className="search-bar__icon" size={16} aria-hidden="true" />
                  <input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="Buscar tareas..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-bar__input"
                    autoComplete="off"
                    aria-label="Buscar tareas"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-bar__clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="controls-bar__group controls-bar__group--sort">
                <div className="sort-group">
                  <span className="sort-group__label">Ordenar por</span>
                  <CustomSelect
                    value={sort}
                    onChange={(v) => setSort(v as TaskSort)}
                    className="sort-group__select"
                    options={[
                      { value: 'recent', label: 'Recientes' },
                      { value: 'priority', label: 'Prioridad' },
                      { value: 'dueDate', label: 'Fecha' },
                    ]}
                  />
                </div>
              </div>
            </>
          )}

          {/* Grupo 4: acción siempre visible */}
          <div className="controls-bar__group controls-bar__group--action">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setShowModal(true)}
            >
              Nueva tarea
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      {loading ? (
        <TaskListSkeleton view={effectiveView} count={effectiveView === 'grid' ? 6 : 3} />
      ) : effectiveView === 'list' ? (
        <TodoList tasks={filteredTasks} onDeleteCompleted={completedCount > 0 ? handleDeleteCompleted : undefined} onDeleteRequest={handleDeleteRequest} />
      ) : tasks.length === 0 ? (
        <p className="empty">Todavía no tenés tareas. ¡Usá "Nueva tarea" para crear la primera!</p>
      ) : filteredTasks.length === 0 ? (
        <p className="empty">No encontramos tareas que coincidan con "{searchQuery}".</p>
      ) : (
        <TaskGrid tasks={filteredTasks} onDeleteCompleted={completedCount > 0 ? handleDeleteCompleted : undefined} onDeleteRequest={handleDeleteRequest} />
      )}

      {/* FAB: solo en mobile, para crear tarea al scrollear lejos de la toolbar */}
      {isMobile && (
        <button
          type="button"
          className="fab"
          onClick={() => setShowModal(true)}
          aria-label="Nueva tarea"
        >
          +
        </button>
      )}

      {/* Modal de nueva tarea */}
      {user && showModal && (
        <TodoForm userId={user.uid} onClose={() => setShowModal(false)} />
      )}


      {isSendingEmail && <EmailSendAnimation />}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Desarrollado por <a href="https://acperezjulia.github.io/" target="_blank" rel="noopener noreferrer">Analía Pérez Juliá</a></p>
      </footer>
    </main>
  )
}

