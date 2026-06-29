import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from './firebase'
import { dateStringToTimestamp } from '../utils/format'
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
      ? { dueDate: dateStringToTimestamp(values.dueDate) }
      : {}),
    ...(values.priority ? { priority: values.priority } : {}),
    ...(values.label ? { label: values.label } : {}),
  })
}

/**
 * Edita los campos editables de una tarea (título, descripción, prioridad,
 * fecha). updateDoc hace merge: no toca userId, createdAt ni completed, así
 * que la regla de update de Firestore (userId no puede cambiar) se cumple.
 *
 * Para prioridad y fecha usamos deleteField() cuando vienen vacías: así, si
 * el usuario borra una prioridad o fecha que existía, el campo se elimina del
 * documento en vez de quedar como null.
 */
export async function updateTask(taskId: string, values: TaskFormValues) {
  await updateDoc(doc(db, 'tasks', taskId), {
    title: values.title,
    description: values.description,
    priority: values.priority ?? deleteField(),
    dueDate: values.dueDate
      ? dateStringToTimestamp(values.dueDate)
      : deleteField(),
    label: values.label || deleteField(),
  })
}

/**
 * Marca una tarea como completada o pendiente.
 * Solo cambia el campo completed; se recibe el nuevo valor ya calculado.
 */
export async function toggleTaskCompleted(taskId: string, completed: boolean) {
  await updateDoc(doc(db, 'tasks', taskId), { completed })
}

/** Elimina una tarea por su id. */
export async function deleteTask(taskId: string) {
  await deleteDoc(doc(db, 'tasks', taskId))
}

/**
 * Elimina todas las tareas completadas de una vez usando writeBatch.
 * Firestore permite hasta 500 operaciones por batch — más que suficiente
 * para una app personal.
 */
export async function deleteCompletedTasks(taskIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  taskIds.forEach((id) => batch.delete(doc(db, 'tasks', id)))
  await batch.commit()
}

/**
 * Guarda preferencias del usuario (actualmente solo el tema) en
 * users/{uid}. Usa merge:true para no pisar otros campos del documento.
 *
 * Requiere la regla de Firestore:
 *   match /users/{uid} { allow read, write: if request.auth.uid == uid; }
 */
export async function saveUserProfile(uid: string, data: { theme?: string }): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
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
