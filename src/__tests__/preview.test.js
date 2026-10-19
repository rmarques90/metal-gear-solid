import { describe, expect, it } from 'vitest'
import { previewDaSecao } from '../data'

describe('previewDaSecao', () => {
  it('mantém textos curtos sem alterar', () => {
    const secao = { paragrafos: ['Texto curto.'] }
    expect(previewDaSecao(secao)).toBe('Texto curto.')
  })

  it('nunca passa de 200 caracteres, mesmo com reticências', () => {
    const longo = Array.from({ length: 80 }, (_, i) => `palavra${i}`).join(' ')
    const preview = previewDaSecao({ paragrafos: [longo] })
    expect(preview.length).toBeLessThanOrEqual(200)
    expect(preview.endsWith('…')).toBe(true)
  })

  it('corta em uma palavra inteira', () => {
    const longo = 'a '.repeat(150)
    const preview = previewDaSecao({ paragrafos: [longo] })
    expect(preview).not.toMatch(/\s…$/)
    expect(preview.replace('…', '').split(' ').every((p) => p === 'a' || p === '')).toBe(true)
  })

  it('junta os parágrafos antes de cortar', () => {
    const preview = previewDaSecao({ paragrafos: ['Primeiro parágrafo.', 'Segundo parágrafo.'] })
    expect(preview).toBe('Primeiro parágrafo. Segundo parágrafo.')
  })
})
