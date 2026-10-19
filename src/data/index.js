// Carrega os dados dos jogos por idioma.
// Se a tradução ainda não existir, usa o original em inglês e sinaliza o fallback.

export const JOGOS_IDS = ['mgs1', 'mgs2', 'mgs3', 'mgs4']

const carregadores = import.meta.glob('./*/mgs*.json')

async function importar(idioma, id) {
  const caminho = `./${idioma}/${id}.json`
  const carregar = carregadores[caminho]
  if (!carregar) return null
  const modulo = await carregar()
  return modulo.default
}

export async function carregarJogo(idioma, id) {
  if (!JOGOS_IDS.includes(id)) return null

  const traduzido = await importar(idioma, id)
  if (traduzido) return { ...traduzido, fallback: false }

  const original = await importar('en', id)
  return original ? { ...original, fallback: idioma !== 'en' } : null
}

export async function carregarTodosJogos(idioma) {
  const jogos = await Promise.all(JOGOS_IDS.map((id) => carregarJogo(idioma, id)))
  return jogos.filter(Boolean)
}

const carregadoresTimeline = import.meta.glob('./*/timeline.json')

export async function carregarTimeline(idioma) {
  const carregar = carregadoresTimeline[`./${idioma}/timeline.json`]
  if (carregar) {
    const modulo = await carregar()
    return { ...modulo.default, fallback: false }
  }
  const original = await carregadoresTimeline['./en/timeline.json']()
  return { ...original.default, fallback: idioma !== 'en' }
}

// IDs de seção contêm "/" (ex.: mgs2/synopsis/plot), que não funcionam em #âncora
export function ancoraDaSecao(secaoId) {
  return secaoId.replaceAll('/', '--')
}

// Resumo curto de uma seção: as primeiras frases do texto.
// Seções só de agrupamento (sem texto próprio) usam o texto da primeira subseção.
export function resumoDaSecao(secao, secoes) {
  let texto = secao.paragrafos.join(' ')
  if (!texto) {
    const subsecao = secoes.find((s) => s.pai === secao.id && s.paragrafos.length)
    texto = subsecao ? subsecao.paragrafos.join(' ') : ''
  }
  if (!texto) return ''

  const frases = texto.match(/[^.!?]+[.!?]+/g) ?? [texto]
  let resumo = ''
  for (const frase of frases.slice(0, 3)) {
    if (resumo && (resumo + frase).length > 450) break
    resumo += frase
  }
  return resumo.trim()
}

// Preview de uma seção com no máximo `limite` caracteres (incluindo "…").
// Corta numa palavra inteira quando possível.
export function previewDaSecao(secao, limite = 200) {
  const texto = secao.paragrafos.join(' ').replace(/\s+/g, ' ').trim()
  if (texto.length <= limite) return texto

  const corte = texto.slice(0, limite - 1)
  const ultimoEspaco = corte.lastIndexOf(' ')
  const base = ultimoEspaco > limite / 2 ? corte.slice(0, ultimoEspaco) : corte
  return `${base.trimEnd()}…`
}
