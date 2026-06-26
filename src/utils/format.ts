import { Timestamp } from 'firebase/firestore'

/**
 * Formatea un Timestamp como fecha legible. Si la tarea tiene una hora puntual
 * (distinta de 00:00) la incluye; si es medianoche, asumimos que el usuario
 * solo eligió un día y mostramos solo la fecha.
 * Ej: "26/06/2026 15:00" (con hora) o "26/06/2026" (solo día).
 */
export function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate()
  const fecha = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  // 00:00 = no se fijó una hora puntual -> mostramos solo la fecha.
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return fecha
  }
  const hora = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${fecha} ${hora}`
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
