import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { auth } from '../services/firebase'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import type { RegisterFormValues } from '../types'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterFormValues>({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validate(): string | null {
    if (form.name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es válido.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const error = validate()
    if (error) { toast.error(error); return }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(user, { displayName: form.name.trim() })
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
      <div className="auth-header">
        <div className="auth-logo">MC</div>
        <h1>Mate Code App</h1>
        <p>Creá tu cuenta y empezá ahora</p>
      </div>

      <div className="auth-card">
        <h2>Crear cuenta</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Nombre completo</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Ana García"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
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
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Crear cuenta →'}
          </button>
        </form>

        <p className="auth-alt">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </div>
    </main>
  )
}
