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
import { CustomSelect } from '../components/CustomSelect'
import { TaskListSkeleton } from '../components/Skeleton'
import { EmailSendAnimation } from '../components/EmailSendAnimation'
import { HelpModal } from '../components/HelpModal'
import { IconMail, IconHelp, IconSun, IconMoon, IconSparkles, IconLogout, IconSearch, IconX } from '@tabler/icons-react'
import { filterTasks, sortTasks } from '../utils/taskHelpers'
import { sendTaskSummary } from '../services/emailService'
import { deleteCompletedTasks, deleteTask } from '../services/firestoreService'
import { saveUserProfile } from '../services/firestoreService'
import type { TaskFilter, TaskSort, Theme, Task } from '../types'

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
  const [isFormOpen, setIsFormOpen] = useState(false)
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
      if (view === 'grid' && e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !showModal) {
        setShowModal(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal, view])

  const effectiveView: 'list' | 'grid' = isMobile ? 'grid' : view
  const activeTasks = tasks.filter((t) => !pendingDeletes.has(t.id))
  const visibleTasks = sortTasks(filterTasks(activeTasks, filter), sort)
  const filteredTasks = searchQuery.trim()
    ? visibleTasks.filter(t => {
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        const q = norm(searchQuery)
        return (
          norm(t.title).includes(q) ||
          norm(t.description ?? '').includes(q) ||
          norm(t.label ?? '').includes(q)
        )
      })
    : visibleTasks

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'tÃº'
  const avatarInitial = (user?.displayName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
  const completedCount = activeTasks.filter((t) => t.completed).length
  const pendingCount = activeTasks.length - completedCount
  const progressPct = activeTasks.length > 0 ? Math.round((completedCount / activeTasks.length) * 100) : 0

  async function handleLogout() {
    await logout()
    toast.success('SesiÃ³n cerrada.')
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

  async function handleDeleteCompleted() {
    const ids = tasks.filter((t) => t.completed).map((t) => t.id)
    if (ids.length === 0) return
    await deleteCompletedTasks(ids)
    toast.success(`${ids.length} tarea${ids.length > 1 ? 's' : ''} eliminada${ids.length > 1 ? 's' : ''}.`)
  }

  async function handleSendSummary() {
    if (!user?.email) return
    setIsSendingEmail(true)

    // Promesa de tiempo mÃ­nimo para que se complete la animaciÃ³n del sobre volando
    const minAnimationTimer = new Promise((resolve) => setTimeout(resolve, 2900))

    // PeticiÃ³n real al backend
    const emailRequest = sendTaskSummary(user.email, tasks, { name: firstName, theme })

    try {
      await Promise.all([minAnimationTimer, emailRequest])
      toast.success('Â¡Resumen enviado! RevisÃ¡ tu email ðŸ“¬')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar el resumen')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <main>
      {/* â”€â”€ Header sticky â”€â”€ */}
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">MC</span>
          <span className="app-header__name">Mate Code App</span>
        </div>

        {/* Theme toggle â€” centrado en desktop, se oculta en mobile (estÃ¡ en el menÃº) */}
        <div className="theme-toggle theme-toggle--center">
          <button
            type="button"
            className={`theme-toggle__btn${theme === 'classic' ? ' is-active' : ''}`}
            onClick={() => handleThemeChange('classic')}
            title="ClÃ¡sico"
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
            title="VÃ­vido"
          ><IconSparkles size={18} /></button>
        </div>

        {/* MenÃº desplegable */}
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
            className="btn btn--ghost"
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
            <IconLogout size={18} /> Cerrar sesiÃ³n
          </button>
        </div>

        <button
          type="button"
          className="header-hamburger"
          onClick={() => setMenuOpen(m => !m)}
          aria-label={menuOpen ? 'Cerrar menÃº' : 'Abrir menÃº'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? 'âœ•' : 'â˜°'}
        </button>

        {menuOpen && (
          <div className="header-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}
      </header>

      {/* â”€â”€ Bienvenida + stats â”€â”€ */}
      <section className="welcome-section">
        <h1>Hola, {firstName} ðŸ‘‹</h1>
        <p className="welcome-section__sub">
          {pendingCount} pendientes Â· {completedCount} completadas
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

      {/* â”€â”€ Toolbar: vista Â· filtros Â· orden Â· acciÃ³n â”€â”€ */}
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
                <CustomSelect
                  value={filter}
                  onChange={(v) => setFilter(v as TaskFilter)}
                  className="filter-select"
                  options={[
                    { value: 'all', label: 'Todas' },
                    { value: 'pending', label: 'Pendientes' },
                    { value: 'completed', label: 'Completadas' },
                  ]}
                />
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

          {/* Grupo 4: acciÃ³n siempre visible */}
          <div className="controls-bar__group controls-bar__group--action">
            <button
              type="button"
              className={`btn ${isFormOpen && effectiveView === 'list' ? 'btn--ghost' : 'btn--primary'}`}
              onClick={() => {
                if (effectiveView === 'grid') setShowModal(true)
                else setIsFormOpen((f) => !f)
              }}
            >
              {isFormOpen && effectiveView === 'list' ? 'Ã— Cancelar' : 'Nueva tarea'}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Buscador â”€â”€ */}
      {!loading && tasks.length > 0 && (
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
              aria-label="Limpiar bÃºsqueda"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      )}

      {/* â”€â”€ Panel inline de nueva tarea (modo lista) â”€â”€ */}
      {!loading && effectiveView === 'list' && isFormOpen && user && (
        <TodoForm
          userId={user.uid}
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* â”€â”€ Contenido principal â”€â”€ */}
      {loading ? (
        <TaskListSkeleton />
      ) : effectiveView === 'list' ? (
        <TodoList tasks={filteredTasks} onDeleteCompleted={completedCount > 0 ? handleDeleteCompleted : undefined} onDeleteRequest={handleDeleteRequest} />
      ) : tasks.length === 0 ? (
        <p className="empty">TodavÃ­a no tenÃ©s tareas. Â¡UsÃ¡ "Nueva tarea" para crear la primera!</p>
      ) : filteredTasks.length === 0 ? (
        <p className="empty">No encontramos tareas que coincidan con "{searchQuery}".</p>
      ) : (
        <TaskGrid tasks={filteredTasks} onDeleteCompleted={completedCount > 0 ? handleDeleteCompleted : undefined} onDeleteRequest={handleDeleteRequest} />
      )}

      {/* FAB: solo en modo grid, acceso rÃ¡pido al scrollear lejos de los controles */}
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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <footer className="app-footer">
        <p>Â© {new Date().getFullYear()} Desarrollado por <a href="https://acperezjulia.github.io/" target="_blank" rel="noopener noreferrer">AnalÃ­a PÃ©rez JuliÃ¡</a></p>
      </footer>
    </main>
  )
}

