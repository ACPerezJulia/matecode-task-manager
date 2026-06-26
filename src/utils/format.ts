import { Timestamp } from 'firebase/firestore'

/** ¿La tarea tiene una hora puntual (distinta de 00:00)? */
function hasTime(date: Date): boolean {
  return date.getHours() !== 0 || date.getMinutes() !== 0
}

/** Hora en formato 24hs "HH:mm" (hour12:false para no obtener "2:00 p.m."). */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Fecha para la UI (cards y lista): "dd/mm" + hora si corresponde, SIN año
 * (las tareas son de corto plazo, el año es ruido en pantalla).
 * Ej: "26/06" o "27/06 12:00". A las 00:00 mostramos solo el día.
 */
export function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  const fecha = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  })
  return hasTime(date) ? `${fecha} ${formatTime(date)}` : fecha
}

/**
 * Fecha para el email: "dd/mm/aa" + hora si corresponde. Lleva el año (corto)
 * porque el email se lee fuera de contexto. Ej: "01/07/26" o "01/07/26 14:00".
 */
export function formatDateForEmail(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  const fecha = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
  return hasTime(date) ? `${fecha} ${formatTime(date)}` : fecha
}

/**
 * Convierte un Timestamp a string "aaaa-mm-ddThh:mm" para usar en
 * <input type="datetime-local">. Usa las partes locales de la fecha (no
 * toISOString, que es UTC y podría correr el día/hora según la zona horaria).
 */
export function toDateInputValue(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convierte un string "aaaa-mm-ddThh:mm" de un <input type="datetime-local">
 * a Timestamp. Construye la fecha con partes locales (new Date(año, mes, día,
 * hora, min)) en vez de new Date("...string..."), que JS interpreta como UTC
 * y, en zonas con offset negativo (ej: Argentina UTC-3), correría la hora.
 *
 * Si el string viniera sin parte de hora (compat. con tareas viejas guardadas
 * con <input type="date">), cae a "00:00".
 */
export function dateStringToTimestamp(dateStr: string): Timestamp {
  const [datePart, timePart = '00:00'] = dateStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return Timestamp.fromDate(new Date(year, month - 1, day, hours, minutes))
}
