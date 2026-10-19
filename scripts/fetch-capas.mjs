// Baixa a capa de cada jogo (infobox do artigo na Wikipédia en) para src/assets/capas/.
// Grava também src/data/capas.json com o crédito de cada arquivo.
// Uso: node scripts/fetch-capas.mjs
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as cheerio from 'cheerio'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pastaCapas = path.join(raiz, 'src', 'assets', 'capas')
const USER_AGENT = 'mgs-guia/0.1 (projeto educacional; contato no repositório)'
const LARGURA = 480

const JOGOS = [
  { id: 'mgs1', artigo: 'Metal_Gear_Solid_(video_game)' },
  { id: 'mgs2', artigo: 'Metal_Gear_Solid_2%3A_Sons_of_Liberty' },
  { id: 'mgs3', artigo: 'Metal_Gear_Solid_3%3A_Snake_Eater' },
  { id: 'mgs4', artigo: 'Metal_Gear_Solid_4%3A_Guns_of_the_Patriots' },
]

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// A API limita requisições (HTTP 429): tenta de novo com espera crescente
async function comTentativas(url) {
  for (let tentativa = 0; ; tentativa++) {
    const resposta = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (resposta.status !== 429 || tentativa >= 4) return resposta
    await esperar(5000 * (tentativa + 1))
  }
}

async function capaDoArtigo(artigo) {
  const html = await (
    await comTentativas(`https://en.wikipedia.org/api/rest_v1/page/html/${artigo}`)
  ).text()
  const src = cheerio.load(html)('.infobox img').first().attr('src')
  if (!src) throw new Error(`Sem capa no infobox de ${artigo}`)
  return src.startsWith('//') ? `https:${src}` : src
}

async function main() {
  await mkdir(pastaCapas, { recursive: true })
  const creditos = {}

  for (const jogo of JOGOS) {
    const original = await capaDoArtigo(jogo.artigo)
    // Miniatura na largura desejada; se não existir (imagem pequena), usa a original
    const miniatura = original.replace(/\/(\d+)px-([^/?]+)/, `/${LARGURA}px-$2`).split('?')[0]
    let resposta = await comTentativas(miniatura)
    if (!resposta.ok) resposta = await comTentativas(original.split('?')[0])
    if (!resposta.ok) throw new Error(`Falha ao baixar a capa de ${jogo.id}: HTTP ${resposta.status}`)

    const arquivo = decodeURIComponent(original.split('?')[0].split('/').pop()).replace(/^\d+px-/, '')
    const extensao = path.extname(arquivo).toLowerCase() || '.jpg'
    const destino = `${jogo.id}${extensao}`
    await writeFile(path.join(pastaCapas, destino), Buffer.from(await resposta.arrayBuffer()))

    creditos[jogo.id] = { arquivo: destino, credito: `Capa: Wikipedia (en) — ${arquivo}` }
    console.log(`✓ ${jogo.id} → ${destino}`)
    await esperar(1500)
  }

  await writeFile(path.join(raiz, 'src', 'data', 'capas.json'), JSON.stringify(creditos, null, 2) + '\n', 'utf8')
  console.log('Concluído: capas.json gravado.')
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
