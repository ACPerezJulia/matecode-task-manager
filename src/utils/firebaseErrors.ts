export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con ese email.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    // Firebase unifica user-not-found y wrong-password en este código más nuevo
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intentá más tarde.',
    'auth/popup-closed-by-user': 'Cerraste el popup antes de completar el inicio de sesión.',
    'auth/cancelled-popup-request': 'Se canceló el inicio de sesión con Google.',
    'auth/network-request-failed': 'Error de red. Verificá tu conexión a internet.',
  }
  return messages[code] ?? 'Ocurrió un error inesperado. Intentá de nuevo.'
}
