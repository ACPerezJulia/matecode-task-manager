import { describe, it, expect } from 'vitest'
import { filterTasks, sortTasks } from '../src/utils/taskHelpers'
import { makeTask } from './helpers'

// taskHelpers es lógica pura: no toca Firebase, así que no necesita mocks.

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: '1', completed: false }),
    makeTask({ id: '2', completed: true }),
    makeTask({ id: '3', completed: false }),
  ]

  it('devuelve todas con el filtro "all"', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3)
  })

  it('devuelve solo las pendientes con "pending"', () => {
    const result = filterTasks(tasks, 'pending')
    expect(result).toHaveLength(2)
    expect(result.every((t) => !t.completed)).toBe(true)
  })

  it('devuelve solo las completadas con "completed"', () => {
    const result = filterTasks(tasks, 'completed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('devuelve [] cuando ninguna tarea coincide (caso borde: filtro sin resultados)', () => {
    const allCompleted = [
      makeTask({ completed: true }),
      makeTask({ completed: true }),
    ]
    expect(filterTasks(allCompleted, 'pending')).toEqual([])
  })
})

describe('sortTasks', () => {
  it('ordena por prioridad (alta primero) y manda las sin prioridad al final', () => {
    const tasks = [
      makeTask({ id: 'low', priority: 'low' }),
      makeTask({ id: 'none' }),
      makeTask({ id: 'high', priority: 'high' }),
      makeTask({ id: 'med', priority: 'medium' }),
    ]
    const result = sortTasks(tasks, 'priority')
    expect(result.map((t) => t.id)).toEqual(['high', 'med', 'low', 'none'])
  })

  it('no muta el array original al ordenar', () => {
    const tasks = [
      makeTask({ id: 'a', priority: 'low' }),
      makeTask({ id: 'b', priority: 'high' }),
    ]
    const original = [...tasks]
    sortTasks(tasks, 'priority')
    expect(tasks).toEqual(original)
  })
})
