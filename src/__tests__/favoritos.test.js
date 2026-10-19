import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '../db'
import { useFavoritosStore } from '../stores/favoritos'

describe('store de favoritos', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.favoritos.clear()
  })

  it('começa sem favoritos', async () => {
    const store = useFavoritosStore()
    await store.carregar()
    expect(store.total).toBe(0)
    expect(store.carregado).toBe(true)
  })

  it('alterna um favorito adicionando e removendo', async () => {
    const store = useFavoritosStore()
    await store.carregar()

    await store.alternar('mgs2/introducao')
    expect(store.estaFavoritado('mgs2/introducao')).toBe(true)
    expect(await db.favoritos.count()).toBe(1)

    await store.alternar('mgs2/introducao')
    expect(store.estaFavoritado('mgs2/introducao')).toBe(false)
    expect(await db.favoritos.count()).toBe(0)
  })

  it('persiste e recarrega a partir do banco', async () => {
    const primeira = useFavoritosStore()
    await primeira.adicionar('mgs1/introducao')
    await primeira.adicionar('mgs4/introducao')

    setActivePinia(createPinia())
    const segunda = useFavoritosStore()
    await segunda.carregar()

    expect(segunda.total).toBe(2)
    expect(segunda.estaFavoritado('mgs4/introducao')).toBe(true)
  })

  it('não duplica a mesma seção', async () => {
    const store = useFavoritosStore()
    await store.carregar()
    await store.adicionar('mgs3/introducao')
    await store.adicionar('mgs3/introducao')
    expect(await db.favoritos.count()).toBe(1)
  })
})
