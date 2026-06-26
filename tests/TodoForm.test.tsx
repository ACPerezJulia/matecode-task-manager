import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '../src/components/TodoForm'
import { createTask } from '../src/services/firestoreService'
import toast from 'react-hot-toast'

// Mockeamos el service (único módulo que toca Firebase) y los toasts.
// Así ningún test hace llamadas reales a Firestore: el límite mockeado es
// justo la frontera entre la UI y lo externo.
vi.mock('../src/services/firestoreService')
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

// vi.mocked tipa los mocks para usarlos sin `any`.
const createTaskMock = vi.mocked(createTask)
const toastSuccessMock = vi.mocked(toast.success)
const toastErrorMock = vi.mocked(toast.error)

describe('TodoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crea la tarea con título y descripción (recortados) y avisa con un toast', async () => {
    // Arrange
    createTaskMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TodoForm userId="user-123" />)

    // Act: tipeamos con espacios de más para verificar que se recortan.
    await user.type(screen.getByLabelText('Título'), '  Comprar vino  ')
    await user.type(screen.getByLabelText('Descripción'), '  Para la cena  ')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    // Assert
    expect(createTaskMock).toHaveBeenCalledTimes(1)
    expect(createTaskMock).toHaveBeenCalledWith('user-123', {
      title: 'Comprar vino',
      description: 'Para la cena',
      priority: undefined,
      dueDate: undefined,
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Tarea creada.')
  })

  it('no crea la tarea si falta el título (caso borde: tarea vacía)', async () => {
    const user = userEvent.setup()
    render(<TodoForm userId="user-123" />)

    // Solo descripción, sin título.
    await user.type(screen.getByLabelText('Descripción'), 'Algo')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(createTaskMock).not.toHaveBeenCalled()
    expect(toastErrorMock).toHaveBeenCalledWith('La tarea necesita un título.')
  })

  it('no crea la tarea si falta la descripción (caso borde)', async () => {
    const user = userEvent.setup()
    render(<TodoForm userId="user-123" />)

    await user.type(screen.getByLabelText('Título'), 'Comprar vino')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(createTaskMock).not.toHaveBeenCalled()
    expect(toastErrorMock).toHaveBeenCalledWith('La tarea necesita una descripción.')
  })

  it('muestra un toast de error si el service falla', async () => {
    // Silenciamos el console.error que el componente emite a propósito,
    // para no ensuciar la salida del test.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    createTaskMock.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    render(<TodoForm userId="user-123" />)

    await user.type(screen.getByLabelText('Título'), 'Comprar vino')
    await user.type(screen.getByLabelText('Descripción'), 'Para la cena')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(toastErrorMock).toHaveBeenCalledWith('No se pudo crear la tarea.')
  })
})
