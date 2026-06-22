import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  // Empieza en true: evita que la app asuma "no hay sesión" antes de que
  // Firebase responda. Sin esto, ProtectedRoute redirigiría prematuramente.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe // cancela la suscripción al desmontar
  }, [])

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, logout }
}
