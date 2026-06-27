import '../styles/email-animation.css'

export function EmailSendAnimation() {
  return (
    <div className="email-overlay">
      <div className="email-envelope" aria-hidden="true">
        📧
      </div>
      <div style={{ textAlign: 'center' }}>
        <p className="email-overlay__title">
          Enviando tu resumen...
        </p>
        <p className="email-overlay__subtitle">
          Recibirás un email con tus tareas pendientes
        </p>
      </div>
      <div className="email-dots" aria-hidden="true">
        <div className="email-dots__dot email-dots__dot--1" />
        <div className="email-dots__dot email-dots__dot--2" />
        <div className="email-dots__dot email-dots__dot--3" />
      </div>
    </div>
  )
}
