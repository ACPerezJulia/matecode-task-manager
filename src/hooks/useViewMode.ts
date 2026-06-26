import { useEffect, useState } from 'react'

export type ViewMode = 'list' | 'grid'

const STORAGE_KEY = 'matecode:view'

/**
 * Recuerda la vista elegida (lista / grid) en localStorage, así la preferencia
 * persiste entre recargas y sesiones. Lee el valor guardado al iniciar; si no
 * hay ninguno (o es inválido), arranca en 'list'.
 */
export function useViewMode() {
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'grid' || saved === 'list' ? saved : 'list'
  })

  // Cada vez que cambia la vista, la persistimos.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, view)
  }, [view])

  return { view, setView }
}
