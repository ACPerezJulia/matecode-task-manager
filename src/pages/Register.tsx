import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { auth } from '../services/firebase'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import type { RegisterFormValues } from '../types'

type Strength = 0 | 1 | 2 | 3

function getStrength(pw: string): Strength {
  if (!pw) return 0
  const hasUpper = /[A-Z]/.test(pw)
  const hasNumber = /[0-9]/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)
  if (pw.length >= 8 && hasUpper && hasNumber && hasSymbol) return 3
  if (pw.length >= 6 && hasNumber) return 2
  return 1
}

const STRENGTH_LABEL = ['', 'Débil', 'Media', 'Fuerte'] as const
const STRENGTH_KEY   = ['', 'weak', 'medium', 'strong'] as const

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterFormValues>({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirm, setConfirm] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validate(): string | null {
    if (form.name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El email no es válido.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    if (!/[A-Z]/.test(form.password)) return 'La contraseña debe contener al menos una mayúscula.'
    if (!/[0-9]/.test(form.password)) return 'La contraseña debe contener al menos un número.'
    if (confirm !== form.password) return 'Las contraseñas no coinciden.'
    return null
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      toast.success('Cuenta creada con Google. ¡Bienvenido/a!')
      navigate('/tasks')
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : ''
      toast.error(getFirebaseErrorMessage(code))
    } finally {
      setLoading(false)
    }
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

  const strength = getStrength(form.password)
  const confirmMismatch = confirm.length > 0 && confirm !== form.password

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
            <div className="input-password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                className="input-password-wrapper__toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="strength-bar">
                <div className="strength-bar__segments">
                  {([1, 2, 3] as const).map((level) => (
                    <span
                      key={level}
                      className={`strength-bar__segment${strength >= level ? ` is-filled strength--${STRENGTH_KEY[strength]}` : ''}`}
                    />
                  ))}
                </div>
                <span className={`strength-bar__label strength--${STRENGTH_KEY[strength]}`}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}
            <small className="input-hint">
              Mínimo 6 caracteres · una mayúscula · un número
            </small>
          </div>

          <div>
            <label htmlFor="confirm">Confirmá tu contraseña</label>
            <div className="input-password-wrapper">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
              />
              <button
                type="button"
                className="input-password-wrapper__toggle"
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
            {confirmMismatch && (
              <small className="confirm-error">Las contraseñas no coinciden.</small>
            )}
          </div>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Crear cuenta →'}
          </button>
        </form>

        <div className="auth-divider">o</div>

        <button
          type="button"
          className="btn btn--ghost btn--google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Registrate con Google
        </button>

        <p className="auth-alt">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </div>
    </main>
  )
}
