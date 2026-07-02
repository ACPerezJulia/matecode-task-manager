import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { auth } from '../services/firebase'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import { validateEmail } from '../utils/validate'
import { GoogleIcon } from '../components/GoogleIcon'
import type { AuthFormValues } from '../types'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState<AuthFormValues>({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validate(): string | null {
    if (!validateEmail(form.email)) return 'El email no es válido.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const error = validate()
    if (error) { toast.error(error); return }
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      toast.success('Sesión iniciada.')
      navigate('/tasks')
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : ''
      toast.error(getFirebaseErrorMessage(code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      toast.success('Sesión iniciada con Google.')
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
        <p>Tus tareas, bien cebadas ✦</p>
      </div>

      <div className="auth-card">
        <h2>Iniciá sesión</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Ingresar →'}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <button
          type="button"
          className="btn btn--ghost btn--google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <p className="auth-alt">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-alt">
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </div>
    </main>
  )
}
