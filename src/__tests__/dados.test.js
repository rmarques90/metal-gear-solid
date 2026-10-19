import { describe, expect, it } from 'vitest'
import { JOGOS_IDS, ancoraDaSecao, carregarJogo, carregarTimeline } from '../data'
import { detectarIdiomaNavegador, idiomaValido } from '../i18n'

describe('dados dos jogos', () => {
  it('carrega o jogo no idioma pedido', async () => {
    const jogo = await carregarJogo('pt-BR', 'mgs1')
    expect(jogo.idioma).toBe('pt-BR')
    expect(jogo.fallback).toBe(false)
  })

  it('cada seção tem id, título e parágrafos, e os ids batem com o original', async () => {
    for (const id of JOGOS_IDS) {
      const original = await carregarJogo('en', id)
      const traduzido = await carregarJogo('pt-BR', id)
      expect(traduzido.secoes.map((s) => s.id)).toEqual(original.secoes.map((s) => s.id))
      // Títulos de nível 2 podem só agrupar subseções; subseções precisam de texto
      const subsecoes = new Set(traduzido.secoes.map((s) => s.pai).filter(Boolean))
      for (const secao of traduzido.secoes) {
        expect(secao.titulo).toBeTruthy()
        if (secao.nivel === 3 || !subsecoes.has(secao.id)) {
          expect(secao.paragrafos.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('retorna null para um jogo que não existe', async () => {
    expect(await carregarJogo('pt-BR', 'mgs9')).toBeNull()
  })

  it('a timeline tem eventos com seção válida', async () => {
    const timeline = await carregarTimeline('pt-BR')
    const ids = new Set()
    for (const id of JOGOS_IDS) {
      const jogo = await carregarJogo('en', id)
      jogo.secoes.forEach((s) => ids.add(s.id))
    }
    expect(timeline.eventos).toHaveLength(21)
    for (const evento of timeline.eventos) {
      expect(ids.has(evento.secaoId)).toBe(true)
    }
  })

  it('transforma o id da seção em âncora sem barras', () => {
    expect(ancoraDaSecao('mgs2/synopsis/plot')).toBe('mgs2--synopsis--plot')
  })
})

describe('idioma', () => {
  it('aceita apenas os idiomas suportados', () => {
    expect(idiomaValido('pt-BR')).toBe(true)
    expect(idiomaValido('en')).toBe(true)
    expect(idiomaValido('fr')).toBe(false)
  })

  it('detecta português do navegador e usa inglês para o resto', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis.navigator, 'language')
    const definir = (valor) =>
      Object.defineProperty(globalThis.navigator, 'language', { value: valor, configurable: true })

    definir('pt-PT')
    expect(detectarIdiomaNavegador()).toBe('pt-BR')
    definir('de-DE')
    expect(detectarIdiomaNavegador()).toBe('en')

    if (original) Object.defineProperty(globalThis.navigator, 'language', original)
  })
})
