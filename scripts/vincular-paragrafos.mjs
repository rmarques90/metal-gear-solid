// Para cada evento da timeline, escolhe o parágrafo da seção que melhor corresponde à descrição.
// Grava "paragrafo" (índice) nos JSONs da timeline. Os índices valem para pt-BR porque
// a tradução mantém o mesmo número de parágrafos (validado no pipeline).
// Uso: node scripts/vincular-paragrafos.mjs
import { readFile, writeFile } from 'node:fs/promises'

const STOPWORDS = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'for', 'was', 'his', 'her', 'its', 'are', 'who',
  'has', 'have', 'into', 'after', 'before', 'while', 'when', 'then', 'they', 'their', 'him', 'she',
  'she', 'but', 'not', 'one', 'also', 'over', 'about', 'than', 'been', 'will', 'such', 'which',
])

const palavras = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 3 && !STOPWORDS.has(p))

async function carregarJson(caminho) {
  return JSON.parse(await readFile(caminho, 'utf8'))
}

const timelineEn = await carregarJson('src/data/en/timeline.json')
const secoesPorId = new Map()
for (const jogo of ['mgs1', 'mgs2', 'mgs3', 'mgs4']) {
  const dados = await carregarJson(`src/data/en/${jogo}.json`)
  for (const secao of dados.secoes) secoesPorId.set(secao.id, secao)
}

const escolhas = {}
for (const evento of timelineEn.eventos) {
  const secao = secoesPorId.get(evento.secaoId)
  const alvo = new Set(palavras(`${evento.titulo} ${evento.descricao}`))
  let melhor = { indice: 0, pontos: -1 }
  secao.paragrafos.forEach((paragrafo, indice) => {
    const pontos = palavras(paragrafo).filter((p) => alvo.has(p)).length
    if (pontos > melhor.pontos) melhor = { indice, pontos }
  })
  escolhas[evento.id] = melhor.indice
  console.log(
    `${evento.id.padEnd(28)} §${melhor.indice} (${melhor.pontos} pts) ${secao.paragrafos[melhor.indice].slice(0, 90)}…`,
  )
}

for (const idioma of ['en', 'pt-BR']) {
  const caminho = `src/data/${idioma}/timeline.json`
  const dados = await carregarJson(caminho)
  for (const evento of dados.eventos) {
    evento.paragrafo = escolhas[evento.id] ?? 0
  }
  await writeFile(caminho, JSON.stringify(dados, null, 2) + '\n', 'utf8')
}
console.log('índices gravados em en e pt-BR')
