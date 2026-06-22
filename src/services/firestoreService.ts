import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Task, TaskFormValues } from '../types'

// Referencia única a la colección, reutilizada por todas las operaciones.
const tasksRef = collection(db, 'tasks')

/**
 * Crea una tarea para el usuario dado.
 * - createdAt usa serverTimestamp() para que la hora la ponga el servidor,
 *   no el reloj (posiblemente desfasado) del cliente.
 * - dueDate y priority son opcionales: solo se incluyen si vienen, así no
 *   guardamos campos en null/undefined sin sentido.
 */
export async function createTask(userId: string, values: TaskFormValues) {
  await addDoc(tasksRef, {
    userId,
    title: values.title,
    description: values.description,
    completed: false,
    createdAt: serverTimestamp(),
    ...(values.dueDate
      ? { dueDate: Timestamp.fromDate(new Date(values.dueDate)) }
      : {}),
    ...(values.priority ? { priority: values.priority } : {}),
  })
}

/**
 * Suscribe a las tareas del usuario en tiempo real.
 * Devuelve la función de cancelación (unsubscribe) que el hook debe llamar
 * al desmontar para evitar fugas de memoria.
 *
 * La query filtra por userId: esto, sumado a las reglas de Firestore, asegura
 * que cada usuario solo recibe sus propias tareas.
 */
export function subscribeToTasks(
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError: (error: FirestoreError) => void,
) {
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'), // más recientes primero
  )

  return onSnapshot(
    q,
    (snapshot) => {
      // Firestore no conoce la forma de nuestros datos, devuelve DocumentData.
      // El cast a Task es una afirmación justificada: sabemos que estos docs
      // tienen la estructura de Task porque somos los únicos que los creamos.
      const tasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Task,
      )
      onChange(tasks)
    },
    onError,
  )
}
