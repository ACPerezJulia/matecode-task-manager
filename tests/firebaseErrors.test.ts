import { describe, it, expect } from 'vitest'
import { getFirebaseErrorMessage } from '../src/utils/firebaseErrors'

describe('getFirebaseErrorMessage', () => {
  it('devuelve mensaje para email ya registrado', () => {
    expect(getFirebaseErrorMessage('auth/email-already-in-use')).toBe(
      'Ya existe una cuenta con ese email.',
    )
  })

  it('devuelve mensaje para email inválido', () => {
    expect(getFirebaseErrorMessage('auth/invalid-email')).toBe(
      'El email no es válido.',
    )
  })

  it('devuelve mensaje para contraseña débil', () => {
    expect(getFirebaseErrorMessage('auth/weak-password')).toBe(
      'La contraseña debe tener al menos 6 caracteres.',
    )
  })

  it('devuelve mensaje para credenciales incorrectas (código unificado nuevo)', () => {
    expect(getFirebaseErrorMessage('auth/invalid-credential')).toBe(
      'Email o contraseña incorrectos.',
    )
  })

  it('devuelve mensaje para demasiados intentos fallidos', () => {
    expect(getFirebaseErrorMessage('auth/too-many-requests')).toBe(
      'Demasiados intentos fallidos. Intentá más tarde.',
    )
  })

  it('devuelve mensaje para popup cerrado por el usuario', () => {
    expect(getFirebaseErrorMessage('auth/popup-closed-by-user')).toBe(
      'Cerraste el popup antes de completar el inicio de sesión.',
    )
  })

  it('devuelve mensaje para error de red', () => {
    expect(getFirebaseErrorMessage('auth/network-request-failed')).toBe(
      'Error de red. Verificá tu conexión a internet.',
    )
  })

  it('devuelve mensaje genérico para código desconocido', () => {
    expect(getFirebaseErrorMessage('auth/unknown-error-code')).toBe(
      'Ocurrió un error inesperado. Intentá de nuevo.',
    )
  })

  it('devuelve mensaje genérico para string vacío', () => {
    expect(getFirebaseErrorMessage('')).toBe(
      'Ocurrió un error inesperado. Intentá de nuevo.',
    )
  })
})
