import { Timestamp } from 'firebase/firestore'

/** Formatea un Timestamp de Firestore como fecha legible (dd/mm/aaaa). */
export function formatDate(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Convierte un Timestamp a string "aaaa-mm-dd" para usar en <input type="date">.
 * Usa las partes locales de la fecha (no toISOString, que es UTC y podría
 * correr el día según la zona horaria).
 */
export function toDateInputValue(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte un string "aaaa-mm-dd" de un <input type="date"> a Timestamp.
 * Construye la fecha con partes locales (new Date(año, mes, día)) en vez de
 * new Date("aaaa-mm-dd"), que JS interpreta como UTC y, en zonas con offset
 * negativo (ej: Argentina UTC-3), terminaría guardando el día anterior.
 */
export function dateStringToTimestamp(dateStr: string): Timestamp {
  const [year, month, day] = dateStr.split('-').map(Number)
  return Timestamp.fromDate(new Date(year, month - 1, day))
}
