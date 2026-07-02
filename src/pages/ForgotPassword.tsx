import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import toast from 'react-hot-toast'
import { auth } from '../services/firebase'
import { validateEmail } from '../utils/validate'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateEmail(email)) {
      toast.error('El email no es válido.')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      // Si el email no existe en Firebase igual mostramos éxito —
      // no revelar si una dirección está registrada o no (email enumeration).
      if (err instanceof FirebaseError && err.code !== 'auth/user-not-found') {
        toast.error('No se pudo enviar el email. Intentá de nuevo.')
        setLoading(false)
        return
      }
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="auth">
      <div className="auth-header">
        <div className="auth-logo">MC</div>
        <h1>Mate Code App</h1>
        <p>Recuperá el acceso a tu cuenta</p>
      </div>

      <div className="auth-card">
        {sent ? (
          <div className="forgot-success">
            <span className="forgot-success__icon">📬</span>
            <h2>Email enviado</h2>
            <p>
              Si <strong>{email}</strong> está registrado, vas a recibir un
              link para restablecer tu contraseña. Revisá también la carpeta
              de spam.
            </p>
            <Link to="/login" className="btn btn--primary">
              Volver al login
            </Link>
          </div>
        ) : (
          <>
            <h2>Olvidé mi contraseña</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
                <small className="input-hint">
                  Te vamos a enviar un link para restablecer tu contraseña.
                </small>
              </div>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link →'}
              </button>
            </form>

            <p className="auth-alt">
              <Link to="/login">← Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
