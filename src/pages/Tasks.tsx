import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Placeholder para verificar logout en Hito 3. Se reemplaza en Hito 6.
export default function Tasks() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    toast.success('Sesión cerrada.')
    navigate('/login')
  }

  return (
    <main>
      <h1>Mis tareas</h1>
      <p>Sesión iniciada como: <strong>{user?.email}</strong></p>
      <button type="button" onClick={handleLogout}>Cerrar sesión</button>
    </main>
  )
}
