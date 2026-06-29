import { useState } from 'react'
import toast from 'react-hot-toast'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface TaskGridProps {
  tasks: Task[]
  onDeleteCompleted?: () => Promise<void>
}

export function TaskGrid({ tasks, onDeleteCompleted }: TaskGridProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    if (!onDeleteCompleted) return
    setIsDeleting(true)
    try {
      await onDeleteCompleted()
      setShowConfirm(false)
    } catch {
      toast.error('No se pudieron eliminar las tareas.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (tasks.length === 0) {
    return <p className="empty">No hay tareas que coincidan con el filtro.</p>
  }

  const pending = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)

  return (
    <div className="task-grid-wrap">
      {pending.length > 0 && (
        <section>
          <h2 className="task-section__title">Pendientes ({pending.length})</h2>
          <ul className="task-grid">
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="task-section__title">
            Completadas ({completed.length})
            {onDeleteCompleted && !showConfirm && (
              <button
                type="button"
                className="section-clean-btn"
                onClick={() => setShowConfirm(true)}
                title="Eliminar todas las completadas"
              >
                🧹
              </button>
            )}
          </h2>
          {showConfirm && (
            <div className="delete-confirm">
              <span className="delete-confirm__text">
                ¿Eliminar {completed.length} tarea{completed.length > 1 ? 's' : ''} completada{completed.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.
              </span>
              <div className="delete-confirm__actions">
                <button type="button" className="btn btn--danger btn--sm" onClick={handleConfirm} disabled={isDeleting}>
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <ul className="task-grid">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
