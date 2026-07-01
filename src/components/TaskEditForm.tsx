import { CustomSelect } from './CustomSelect'
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
          name="title"
          value={edit.title}
          onChange={(e) => edit.setTitle(e.target.value)}
          aria-label="Título"
        />
      </div>
      <div>
        <label htmlFor={`edit-desc-${edit.taskId}`}>Descripción</label>
        <textarea
          id={`edit-desc-${edit.taskId}`}
          name="description"
          value={edit.description}
          onChange={(e) => edit.setDescription(e.target.value)}
          aria-label="Descripción"
        />
      </div>
      <p className="task-panel__optional-label">Opcionales</p>
      <div className="task-panel__meta">
        <div>
          <label htmlFor={`edit-priority-${edit.taskId}`}>Prioridad</label>
          <CustomSelect
            id={`edit-priority-${edit.taskId}`}
            value={edit.priority ?? ''}
            onChange={edit.onPriorityChange}
            options={[
              { value: '', label: 'Sin prioridad' },
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
            ]}
          />
        </div>
        <div>
          <label htmlFor={`edit-label-${edit.taskId}`}>Etiqueta</label>
          <input
            id={`edit-label-${edit.taskId}`}
            name="label"
            type="text"
            value={edit.label}
            onChange={(e) => edit.setLabel(e.target.value)}
            placeholder="#Trabajo, #Personal, #Dev..."
            aria-label="Etiqueta"
          />
        </div>
        <div>
          <label htmlFor={`edit-date-${edit.taskId}`}>Fecha</label>
          <input
            id={`edit-date-${edit.taskId}`}
            name="date"
            type="date"
            value={edit.dueDateStr}
            onChange={(e) => edit.setDueDateStr(e.target.value)}
            aria-label="Fecha"
          />
        </div>
        <div>
          <label htmlFor={`edit-time-${edit.taskId}`}>Hora</label>
          <input
            id={`edit-time-${edit.taskId}`}
            name="time"
            type="time"
            value={edit.dueTimeStr}
            onChange={(e) => edit.setDueTimeStr(e.target.value)}
            aria-label="Hora"
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
