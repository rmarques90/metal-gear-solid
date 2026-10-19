// Baixa as imagens dos eventos da timeline a partir dos artigos da Wikipédia (en).
// Salva em src/assets/timeline/ e grava "imagem" e "credito" nos JSONs da timeline.
// Uso: node scripts/fetch-imagens.mjs
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as cheerio from 'cheerio'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pastaImagens = path.join(raiz, 'src', 'assets', 'timeline')
const USER_AGENT = 'mgs-guia/0.1 (projeto educacional; contato no repositório)'
const LARGURA = 640

// Para cada evento: artigo de origem + trecho do nome do arquivo (ou "capa" = infobox)
const MAPA = [
  { evento: 'evt-mgs1-shadow-moses', artigo: 'Metal_Gear_Solid_(video_game)', arquivo: 'Metal_Gear_REX_MGS_PSX' },
  { evento: 'evt-mgs1-convocacao', artigo: 'Solid_Snake', arquivo: 'capa' },
  { evento: 'evt-mgs1-rex', artigo: 'Metal_Gear_REX', arquivo: 'capa' },
  { evento: 'evt-mgs1-ocelot', artigo: 'Revolver_Ocelot', arquivo: 'capa' },
  { evento: 'evt-mgs1-mantis', artigo: 'Psycho_Mantis', arquivo: 'capa' },
  { evento: 'evt-mgs1-liquid', artigo: 'Liquid_Snake', arquivo: 'capa' },
  // Gray Fox: o artigo "Gray Fox" é sobre o animal; usa-se a foto do personagem no Commons
  {
    evento: 'evt-mgs1-gray-fox',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Metal_Gear_Solid_Grey_Fox_-_C2E2_2015_%2817281825852%29.jpg/960px-Metal_Gear_Solid_Grey_Fox_-_C2E2_2015_%2817281825852%29.jpg',
    credito: 'Metal Gear Solid Grey Fox - C2E2 2015, por Chris Favero (CC BY-SA 2.0), via Wikimedia Commons',
  },
  { evento: 'evt-mgs1-morte-liquid', artigo: 'Liquid_Snake', arquivo: 'capa' },
  { evento: 'evt-mgs2-petroleiro', artigo: 'Metal_Gear_Solid_2%3A_Sons_of_Liberty', arquivo: 'MetalGearSolid2-Substance_screenshot1' },
  { evento: 'evt-mgs3-operacao', artigo: 'Metal_Gear_Solid_3%3A_Snake_Eater', arquivo: 'MgsCamoExample' },
  { evento: 'evt-mgs4-conclusao', artigo: 'Metal_Gear_Solid_4%3A_Guns_of_the_Patriots', arquivo: 'Metal_Gear_Solid_4_gameplay' },
  { evento: 'evt-mgs2-big-shell', artigo: 'Metal_Gear_Solid_2%3A_Sons_of_Liberty', arquivo: 'capa' },
  { evento: 'evt-mgs2-olga', artigo: 'Raiden_(Metal_Gear)', arquivo: 'capa' },
  { evento: 'evt-mgs2-s3', artigo: 'Revolver_Ocelot', arquivo: 'capa' },
  { evento: 'evt-mgs3-boss-traicao', artigo: 'The_Boss_(Metal_Gear)', arquivo: 'capa' },
  { evento: 'evt-mgs3-sokolov', artigo: 'Big_Boss_(Metal_Gear)', arquivo: 'capa' },
  { evento: 'evt-mgs3-boss-morte', artigo: 'The_Boss_(Metal_Gear)', arquivo: 'capa' },
  { evento: 'evt-mgs3-big-boss-titulo', artigo: 'Big_Boss_(Metal_Gear)', arquivo: 'capa' },
  { evento: 'evt-mgs4-naomi', artigo: 'Metal_Gear_Solid_4%3A_Guns_of_the_Patriots', arquivo: 'capa' },
  { evento: 'evt-mgs4-nuke', artigo: 'Metal_Gear_REX', arquivo: 'capa' },
  { evento: 'evt-mgs4-big-boss', artigo: 'Big_Boss_(Metal_Gear)', arquivo: 'capa' },
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

async function baixar(url) {
  const resposta = await comTentativas(url)
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`)
  return Buffer.from(await resposta.arrayBuffer())
}

// Troca a miniatura de 250px pela versão de LARGURA px (a URL de thumb aceita qualquer largura)
function urlNaLargura(src) {
  const url = src.startsWith('//') ? `https:${src}` : src
  return url.replace(/\/(\d+)px-([^/?]+)/, `/${LARGURA}px-$2`).split('?')[0]
}

function nomeDoArquivo(src) {
  const partes = src.split('?')[0].split('/')
  return partes[partes.length - 1].replace(/^\d+px-/, '')
}

async function imagensDoArtigo(artigo) {
  const html = await (
    await comTentativas(`https://en.wikipedia.org/api/rest_v1/page/html/${artigo}`)
  ).text()
  const $ = cheerio.load(html)
  const capa = $('.infobox img').first().attr('src')
  const todas = $('img')
    .map((_, img) => $(img).attr('src'))
    .get()
    .filter((src) => src?.includes('wikimedia.org/wikipedia'))
  return { capa, todas }
}

async function localizarImagem(mapa, cache) {
  if (!cache.has(mapa.artigo)) cache.set(mapa.artigo, await imagensDoArtigo(mapa.artigo))
  const { capa, todas } = cache.get(mapa.artigo)
  if (mapa.arquivo === 'capa') return capa
  return todas.find((src) => src.includes(mapa.arquivo))
}

async function main() {
  await mkdir(pastaImagens, { recursive: true })
  const cache = new Map()
  const creditos = {}

  for (const mapa of MAPA) {
    const src = mapa.url ?? (await localizarImagem(mapa, cache))
    if (!src) {
      console.warn(`⚠ não encontrada: ${mapa.evento} (${mapa.arquivo})`)
      continue
    }
    const arquivo = nomeDoArquivo(src)
    const extensao = path.extname(arquivo).toLowerCase() || '.jpg'
    const destino = `${mapa.evento}${extensao}`

    // Imagens menores que LARGURA não têm essa miniatura: usa a URL original do artigo
    let bytes
    try {
      bytes = await baixar(urlNaLargura(src))
    } catch {
      bytes = await baixar(src.startsWith('//') ? `https:${src}` : src)
    }
    await writeFile(path.join(pastaImagens, destino), bytes)

    creditos[mapa.evento] = {
      imagem: `/src/assets/timeline/${destino}`,
      credito: mapa.credito ?? `Wikipedia (en) — ${decodeURIComponent(arquivo)}`,
    }
    console.log(`✓ ${mapa.evento} → ${destino} (${bytes.length} bytes)`)
  }

  // Atualiza os JSONs da timeline (en e pt-BR) com caminho e crédito
  for (const idioma of ['en', 'pt-BR']) {
    const arquivo = path.join(raiz, 'src', 'data', idioma, 'timeline.json')
    const dados = JSON.parse(await readFile(arquivo, 'utf8'))
    for (const evento of dados.eventos) {
      if (creditos[evento.id]) Object.assign(evento, creditos[evento.id])
    }
    await writeFile(arquivo, JSON.stringify(dados, null, 2) + '\n', 'utf8')
  }
  console.log(`Concluído: ${Object.keys(creditos).length}/${MAPA.length} imagens.`)
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
