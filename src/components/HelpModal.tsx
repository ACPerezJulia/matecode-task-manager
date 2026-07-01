import type { ReactNode } from 'react'
import {
  IconFilePlus,
  IconCircleCheck,
  IconPencil,
  IconTrash,
  IconFilter,
  IconSearch,
  IconLayoutGrid,
  IconPalette,
  IconMail,
  IconTrashX,
  IconSun,
  IconMoon,
  IconSparkles,
} from '@tabler/icons-react'

interface HelpItem {
  icon: ReactNode
  title: string
  description: ReactNode
}

const HELP_ITEMS: HelpItem[] = [
  {
    icon: <IconFilePlus size={20} />,
    title: 'Crear una tarea',
    description:
      'Tocá el botón + para abrir el formulario. En desktop también podés usar Ctrl + Enter.',
  },
  {
    icon: <IconCircleCheck size={20} />,
    title: 'Completar una tarea',
    description:
      'Tocá el círculo o el check que aparece en la tarjeta para marcarla como hecha. El contador de progreso se actualiza automáticamente.',
  },
  {
    icon: <IconPencil size={20} />,
    title: 'Editar una tarea',
    description:
      'Tocá el ícono de lápiz sobre la tarea. Se abre el mismo formulario con los datos cargados y podés modificar lo que necesites.',
  },
  {
    icon: <IconTrash size={20} />,
    title: 'Eliminar una tarea',
    description:
      'Tocá el ícono × para eliminar. Tenés 5 segundos para arrepentirte: apretá "Deshacer" para recuperarla.',
  },
  {
    icon: <IconFilter size={20} />,
    title: 'Filtrar y ordenar',
    description:
      'Filtrá tus tareas por Todas / Pendientes / Completadas. Ordenalas por las más recientes primero, por fecha o por prioridad.',
  },
  {
    icon: <IconSearch size={20} />,
    title: 'Buscar tareas',
    description:
      'Escribí en el buscador para filtrar las tareas en tiempo real por título o descripción. Se combina con los filtros de estado y el orden activo.',
  },
  {
    icon: <IconLayoutGrid size={20} />,
    title: 'Vista lista o grilla',
    description:
      'Disponible en desktop y tablet. En la barra de controles podés alternar entre vista lista y grilla.',
  },
  {
    icon: <IconPalette size={20} />,
    title: 'Temas visuales',
    description: <>Cambiá el aspecto entre <IconSun size={13} /> claro, <IconMoon size={13} /> oscuro o <IconSparkles size={13} /> vívido desde el header. La preferencia se guarda automáticamente en tu cuenta.</>,
  },
  {
    icon: <IconMail size={20} />,
    title: 'Resumen por email',
    description:
      'El botón "Enviar resumen" te envía un email con tus tareas agrupadas por prioridad. Llega a la dirección con la que iniciaste sesión.',
  },
  {
    icon: <IconTrashX size={20} />,
    title: 'Limpiar completadas',
    description:
      'El botón de escoba aparece cuando hay tareas completadas. Las elimina todas de una vez — tenés 10 segundos para arrepentirte usando "Deshacer".',
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
