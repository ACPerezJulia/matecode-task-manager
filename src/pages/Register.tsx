import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { auth } from '../services/firebase'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import type { AuthFormValues } from '../types'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<AuthFormValues>({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validate(): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es válido.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password)
      toast.success('Cuenta creada. ¡Bienvenido/a!')
      navigate('/tasks')
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : ''
      toast.error(getFirebaseErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth">
      <h1>Crear cuenta</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Cargando...' : 'Crear cuenta'}
        </button>
      </form>
      <p className="auth-alt">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </main>
  )
}
