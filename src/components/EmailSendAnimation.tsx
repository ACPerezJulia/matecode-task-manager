import '../styles/email-animation.css'

export type SendStatus = 'idle' | 'sending' | 'success' | 'error'

interface Props {
  status: SendStatus
  onClick: () => void
  disabled?: boolean
}

function EnvelopeIcon({ sending }: { sending: boolean }) {
  return (
    <svg
      className={`email-icon${sending ? ' email-icon--sending' : ''}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1.5" y="4" width="17" height="13" rx="2" />
      <path d="M1.5 7l8.5 5.5 8.5-5.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      className="email-icon email-icon--check"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10l5 5 7-9" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      className="email-icon"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l8 8M14 6l-8 8" />
    </svg>
  )
}

function DotPulse() {
  return (
    <span className="dot-pulse" aria-hidden="true">
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
    </span>
  )
}

export function EmailSendAnimation({ status, onClick, disabled }: Props) {
  const isDisabled = disabled || status === 'sending'

  const ariaLabel =
    status === 'sending' ? 'Enviando resumen…' :
    status === 'success' ? 'Resumen enviado' :
    status === 'error'   ? 'Error al enviar' :
    'Enviar resumen por email'

  return (
    <button
      type="button"
      className={`btn btn--ghost email-send-btn email-send-btn--${status}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      <span className="email-send-btn__icon">
        {status === 'success' ? <CheckIcon /> :
         status === 'error'   ? <XIcon />    :
         <EnvelopeIcon sending={status === 'sending'} />}
      </span>

      <span className="email-send-btn__label">
        {status === 'sending' ? <>Enviando<DotPulse /></> :
         status === 'success' ? '¡Enviado!'               :
         status === 'error'   ? 'Error'                   :
         'Resumen'}
      </span>
    </button>
  )
}
