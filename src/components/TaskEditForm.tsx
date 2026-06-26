import type { TaskEditState } from '../hooks/useTaskItem'

interface TaskEditFormProps {
  edit: TaskEditState
}

/**
 * Formulario de edición inline de una tarea. Es idéntico en lista y grid, así
 * que se escribe una sola vez. Recibe el estado y los handlers del hook
 * useTaskItem a través de la prop `edit`.
 */
export function TaskEditForm({ edit }: TaskEditFormProps) {
  return (
    <form className="task-form" onSubmit={edit.save}>
      <div>
        <label htmlFor={`edit-title-${edit.taskId}`}>Título</label>
        <input
          id={`edit-title-${edit.taskId}`}
          value={edit.title}
          onChange={(e) => edit.setTitle(e.target.value)}
          aria-label="Título"
        />
      </div>
      <div>
        <label htmlFor={`edit-desc-${edit.taskId}`}>Descripción</label>
        <textarea
          id={`edit-desc-${edit.taskId}`}
          value={edit.description}
          onChange={(e) => edit.setDescription(e.target.value)}
          aria-label="Descripción"
        />
      </div>
      <div className="form-row">
        <div>
          <label htmlFor={`edit-prio-${edit.taskId}`}>Prioridad</label>
          <select
            id={`edit-prio-${edit.taskId}`}
            value={edit.priority ?? ''}
            onChange={edit.onPriorityChange}
            aria-label="Prioridad"
          >
            <option value="">Sin prioridad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label htmlFor={`edit-due-${edit.taskId}`}>Fecha y hora</label>
          <input
            id={`edit-due-${edit.taskId}`}
            type="datetime-local"
            value={edit.dueDate}
            onChange={(e) => edit.setDueDate(e.target.value)}
            aria-label="Fecha y hora"
          />
        </div>
      </div>
      <div className="task-actions">
        <button type="submit" className="btn btn--primary" disabled={edit.busy}>
          Guardar
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={edit.cancel}
          disabled={edit.busy}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
