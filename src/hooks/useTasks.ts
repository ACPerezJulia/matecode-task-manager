import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { subscribeToTasks } from '../services/firestoreService'
import type { Task } from '../types'

/**
 * Hook que expone las tareas del usuario en tiempo real.
 * Empieza en loading=true para poder mostrar skeletons mientras llega
 * el primer snapshot.
 */
export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sin usuario no hay nada a qué suscribirse (ej: durante el logout).
    if (!userId) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToTasks(
      userId,
      (nextTasks) => {
        setTasks(nextTasks)
        setLoading(false)
      },
      (error) => {
        console.error('Error al cargar tareas:', error)
        toast.error('No se pudieron cargar las tareas.')
        setLoading(false)
      },
    )

    // Cancela la suscripción al desmontar o al cambiar el userId.
    return unsubscribe
  }, [userId])

  return { tasks, loading }
}
