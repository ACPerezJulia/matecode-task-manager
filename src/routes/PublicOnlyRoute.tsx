import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface PublicOnlyRouteProps {
  children: ReactNode
}

/**
 * Inverso de ProtectedRoute: protege las rutas "solo para no autenticados"
 * (login y registro). Si el usuario YA tiene sesión, no tiene sentido
 * mostrarle el login -> lo redirige a /tasks.
 */
export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, loading } = useAuth()

  // Mientras Firebase resuelve si hay sesión, no decidimos nada todavía
  // (mismo motivo que en ProtectedRoute: evitar parpadeo/redirección prematura).
  if (loading) {
    return <p>Cargando...</p>
  }

  // Ya hay sesión: lo mandamos a la zona privada en vez de mostrar login.
  if (user) {
    return <Navigate to="/tasks" replace />
  }

  // Sin sesión: mostramos la página pública (login o registro).
  return <>{children}</>
}
