import { Timestamp } from 'firebase/firestore'
import type { Task } from '../src/types'

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-123',
    title: 'Tarea',
    description: 'Desc',
    completed: false,
    createdAt: Timestamp.fromMillis(0),
    ...overrides,
  }
}
