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
      'Tocá el botón "Nueva tarea" (o el + en celular) para agregar una nueva tarea. Desde la computadora también podés usar Ctrl + Enter.',
  },
  {
    icon: <IconCircleCheck size={20} />,
    title: 'Completar una tarea',
    description:
      'Tocá el círculo al lado de la tarea para marcarla como hecha.',
  },
  {
    icon: <IconPencil size={20} />,
    title: 'Editar una tarea',
    description:
      'Tocá el ícono de lápiz para editar la tarea.',
  },
  {
    icon: <IconTrash size={20} />,
    title: 'Eliminar una tarea',
    description:
      'Tocá el ícono × para eliminar. Tenés 5 segundos para arrepentirte: apretá "Deshacer" en el aviso que aparece.',
  },
  {
    icon: <IconFilter size={20} />,
    title: 'Filtrar por estado',
    description:
      'Tocá los recuadros de Total, Pendientes o Completadas para filtrar.',
  },
  {
    icon: <IconSearch size={20} />,
    title: 'Buscar y ordenar',
    description:
      'Escribí en el buscador para encontrar tareas por nombre, descripción o etiqueta. Con "Ordenar por" podés cambiar el orden en que aparecen.',
  },
  {
    icon: <IconLayoutGrid size={20} />,
    title: 'Vista lista o grilla',
    description:
      'En computadora o tablet podés elegir ver las tareas en lista o en grilla usando los botones de arriba a la izquierda.',
  },
  {
    icon: <IconPalette size={20} />,
    title: 'Temas visuales',
    description: <>Cambiá el aspecto entre <IconSun size={13} /> claro, <IconMoon size={13} /> oscuro o <IconSparkles size={13} /> vívido.</>,
  },
  {
    icon: <IconMail size={20} />,
    title: 'Resumen por email',
    description:
      'En computadora encontrás el botón "Enviar resumen" en la barra superior. En celular está dentro del menú ☰. Te llega al email con el que iniciaste sesión.',
  },
  {
    icon: <IconTrashX size={20} />,
    title: 'Limpiar completadas',
    description:
      'Cuando tenés tareas completadas, aparece un botón para eliminarlas todas de una vez. Tenés 10 segundos para arrepentirte con "Deshacer".',
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
