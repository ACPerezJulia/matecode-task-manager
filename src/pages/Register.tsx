import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { auth } from '../services/firebase'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'
import { validateEmail } from '../utils/validate'
import { GoogleIcon } from '../components/GoogleIcon'
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
    if (!validateEmail(form.email)) return 'El email no es válido.'
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
          <GoogleIcon />
          Registrate con Google
        </button>

        <p className="auth-alt">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </div>
    </main>
  )
}
