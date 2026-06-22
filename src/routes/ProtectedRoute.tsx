import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Mientras Firebase resuelve si hay sesión, no decidimos nada todavía.
  // Sin este chequeo, al recargar redirigiríamos a /login antes de saber
  // que el usuario sí estaba logueado (el parpadeo que queremos evitar).
  if (loading) {
    return <p>Cargando...</p>
  }

  // Ya sabemos el estado real: sin usuario, al login.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Hay sesión: mostramos la ruta protegida.
  return <>{children}</>
}
