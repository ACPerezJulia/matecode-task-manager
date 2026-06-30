interface HelpItem {
  icon: string
  title: string
  description: string
}

const HELP_ITEMS: HelpItem[] = [
  {
    icon: '📝',
    title: 'Crear una tarea',
    description:
      'Tocá el botón + para abrir el formulario. En desktop también podés usar Ctrl + Enter.',
  },
  {
    icon: '✅',
    title: 'Completar una tarea',
    description:
      'Tocá el círculo o el check que aparece en la tarjeta para marcarla como hecha. El contador de progreso se actualiza automáticamente.',
  },
  {
    icon: '✏️',
    title: 'Editar una tarea',
    description:
      'Tocá el ícono de lápiz sobre la tarea. Se abre el mismo formulario con los datos cargados y podés modificar lo que necesites.',
  },
  {
    icon: '🗑️',
    title: 'Eliminar una tarea',
    description:
      'Tocá el ícono × para eliminar. Tenés 5 segundos para arrepentirte: apretá "Deshacer" para recuperarla.',
  },
  {
    icon: '🔍',
    title: 'Filtrar y ordenar',
    description:
      'Filtrá tus tareas por Todas / Pendientes / Completadas. Ordenalas por las más recientes primero, por fecha o por prioridad.',
  },
  {
    icon: '🔄',
    title: 'Vista lista o grilla',
    description:
      'Disponible en desktop y tablet. En la barra de controles podés alternar entre vista lista y grilla.',
  },
  {
    icon: '🎨',
    title: 'Temas visuales',
    description:
      'Cambiá el aspecto entre ☀️ claro, 🌙 oscuro o ✨ vívido. La preferencia se guarda automáticamente en tu cuenta.',
  },
  {
    icon: '✉️',
    title: 'Resumen por email',
    description:
      'El botón "Resumen" te envía un email con tus tareas agrupadas por prioridad. Llega a la dirección con la que iniciaste sesión.',
  },
  {
    icon: '🧹',
    title: 'Limpiar completadas',
    description:
      'El botón 🧹 aparecerá cuando haya tareas completadas. Las elimina todas de una sola vez para mantener la lista ordenada.',
  },
]

interface Props {
  onClose: () => void
}

export function HelpModal({ onClose }: Props) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="task-modal-overlay" onClick={handleOverlayClick}>
      <div className="task-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <div className="task-modal__header">
          <div>
            <h2 className="task-modal__title" id="help-modal-title">Cómo usar Mate Code App</h2>
            <p className="task-modal__hint">Guía rápida de funcionalidades</p>
          </div>
          <button
            type="button"
            className="task-modal__close"
            onClick={onClose}
            aria-label="Cerrar ayuda"
          >
            ✕
          </button>
        </div>

        <ul className="help-tips">
          {HELP_ITEMS.map((item) => (
            <li key={item.title} className="help-tip">
              <span className="help-tip__icon" aria-hidden="true">{item.icon}</span>
              <div className="help-tip__body">
                <strong className="help-tip__title">{item.title}</strong>
                <p className="help-tip__desc">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
