import Dexie from 'dexie'

// Banco local (IndexedDB). Guarda apenas IDs estáveis, nunca textos traduzidos.
export const db = new Dexie('mgsGuia')

db.version(1).stores({
  // secaoId é único: cada seção só pode ser favoritada uma vez
  favoritos: '++id, &secaoId, criadoEm',
  // chave/valor para preferências (ex.: idioma escolhido)
  preferencias: 'chave',
})

export default db
