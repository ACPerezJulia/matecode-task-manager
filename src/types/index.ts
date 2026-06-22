import { Timestamp } from 'firebase/firestore'

export interface Task {
  id: string
  userId: string
  title: string
  description: string
  completed: boolean
  createdAt: Timestamp
  dueDate?: Timestamp
  priority?: 'low' | 'medium' | 'high'
}

export interface TaskFormValues {
  title: string
  description: string
  dueDate?: string // string en el form, se convierte a Timestamp al guardar
  priority?: 'low' | 'medium' | 'high'
}

export interface AuthFormValues {
  email: string
  password: string
}

export type TaskFilter = 'all' | 'pending' | 'completed'

export type TaskSort = 'recent' | 'priority' | 'dueDate'

export type Theme = 'light' | 'dark'
