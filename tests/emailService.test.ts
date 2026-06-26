import { describe, it, expect, vi, afterEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { sendTaskSummary } from '../src/services/emailService'
import type { Task } from '../src/types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    userId: 'user-123',
    title: 'Tarea',
    description: 'Desc',
    completed: false,
    createdAt: Timestamp.fromMillis(0),
    ...overrides,
  }
}

describe('sendTaskSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('llama a /api/send-email con el payload reducido (solo title y completed)', async () => {
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
      tasks: [{ title: 'Comprar vino', completed: false }],
    })
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
