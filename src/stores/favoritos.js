import { defineStore } from 'pinia'
import { db } from '../db'

// Guarda só os IDs das seções favoritas. O texto vem do JSON no idioma atual.
export const useFavoritosStore = defineStore('favoritos', {
  state: () => ({
    secaoIds: new Set(),
    carregado: false,
  }),

  getters: {
    estaFavoritado: (state) => (secaoId) => state.secaoIds.has(secaoId),
    total: (state) => state.secaoIds.size,
  },

  actions: {
    async carregar() {
      const itens = await db.favoritos.toArray()
      this.secaoIds = new Set(itens.map((item) => item.secaoId))
      this.carregado = true
    },

    async alternar(secaoId) {
      if (this.secaoIds.has(secaoId)) {
        await this.remover(secaoId)
      } else {
        await this.adicionar(secaoId)
      }
    },

    // Atualização otimista: a tela muda antes de gravar no banco
    async adicionar(secaoId) {
      this.secaoIds.add(secaoId)
      try {
        // Transação: evita duplicar a mesma seção (índice secaoId é único)
        await db.transaction('rw', db.favoritos, async () => {
          const existente = await db.favoritos.where('secaoId').equals(secaoId).count()
          if (!existente) {
            await db.favoritos.add({ secaoId, criadoEm: new Date().toISOString() })
          }
        })
      } catch (erro) {
        this.secaoIds.delete(secaoId)
        throw erro
      }
    },

    async remover(secaoId) {
      this.secaoIds.delete(secaoId)
      try {
        await db.favoritos.where('secaoId').equals(secaoId).delete()
      } catch (erro) {
        this.secaoIds.add(secaoId)
        throw erro
      }
    },
  },
})
