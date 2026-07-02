import { describe, it, expect, vi, afterEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { sendTaskSummary } from '../src/services/emailService'
import { formatDateForEmail } from '../src/utils/format'
import { makeTask } from './helpers'

describe('sendTaskSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('llama a /api/send-email con el payload correcto (title, description, completed)', async () => {
    // Arrange: fetch global mockeado con respuesta OK.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    // Act
    await sendTaskSummary('test@example.com', [
      makeTask({ title: 'Comprar vino', completed: false }),
    ])

    // Assert: endpoint propio (nunca AWS) y payload mínimo.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/send-email')
    expect(JSON.parse(options.body)).toEqual({
      to: 'test@example.com',
      tasks: [{ title: 'Comprar vino', description: 'Desc', completed: false }],
    })
  })

  it('incluye la fecha/hora de vencimiento ya formateada en el payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    // Vencimiento con hora puntual (15:00 hora local).
    const dueDate = Timestamp.fromDate(new Date(2026, 5, 26, 15, 0))
    await sendTaskSummary('test@example.com', [
      makeTask({ title: 'Cita odontólogo', dueDate }),
    ])

    const [, options] = fetchMock.mock.calls[0]
    const sent = JSON.parse(options.body)
    // El cliente formatea dueDate ANTES de enviar (no manda el Timestamp).
    // El email usa formato dd/mm/aa (año corto).
    expect(sent.tasks[0].dueDate).toBe(formatDateForEmail(dueDate))
    expect(sent.tasks[0].dueDate).toContain('26/06/26')
  })

  it('lanza con el mensaje del error cuando el serverless falla (caso borde: error del serverless)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No se pudo enviar el email.' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendTaskSummary('test@example.com', [])).rejects.toThrow(
      'No se pudo enviar el email.',
    )
  })
})
