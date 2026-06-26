import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { TodoList } from '../src/components/TodoList'
import type { Task } from '../src/types'

// TodoList renderiza TaskItem, que importa el service. Lo mockeamos para no
// arrastrar Firebase real al test (mismo seam que en TodoForm).
vi.mock('../src/services/firestoreService')
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

// Fábrica de tareas de prueba: valores por defecto + overrides puntuales.
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-123',
    title: 'Tarea de prueba',
    description: 'Descripción',
    completed: false,
    createdAt: Timestamp.fromMillis(0),
    ...overrides,
  }
}

describe('TodoList', () => {
  it('renderiza un ítem por cada tarea', () => {
    // Arrange
    const tasks = [
      makeTask({ id: '1', title: 'Comprar vino' }),
      makeTask({ id: '2', title: 'Escribir informe' }),
    ]

    // Act
    render(<TodoList tasks={tasks} />)

    // Assert
    expect(screen.getByText('Comprar vino')).toBeInTheDocument()
    expect(screen.getByText('Escribir informe')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('muestra el mensaje vacío cuando no hay tareas (caso borde: filtro sin resultados)', () => {
    render(<TodoList tasks={[]} />)

    expect(
      screen.getByText('No hay tareas que coincidan con el filtro.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
