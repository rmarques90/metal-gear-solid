// Coleta os artigos da Wikipédia (en) e gera src/data/en/<jogo>.json
// Uso: node scripts/fetch-wiki.mjs
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as cheerio from 'cheerio'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pastaSaida = path.join(raiz, 'src', 'data', 'en')

// Título do artigo na Wikipédia → dados do jogo no site
const JOGOS = [
  {
    id: 'mgs1',
    artigo: 'Metal Gear Solid (video game)',
    titulo: 'Metal Gear Solid',
    anoLancamento: 1998,
  },
  {
    id: 'mgs2',
    artigo: 'Metal Gear Solid 2: Sons of Liberty',
    titulo: 'Metal Gear Solid 2: Sons of Liberty',
    anoLancamento: 2001,
  },
  {
    id: 'mgs3',
    artigo: 'Metal Gear Solid 3: Snake Eater',
    titulo: 'Metal Gear Solid 3: Snake Eater',
    anoLancamento: 2004,
  },
  {
    id: 'mgs4',
    artigo: 'Metal Gear Solid 4: Guns of the Patriots',
    titulo: 'Metal Gear Solid 4: Guns of the Patriots',
    anoLancamento: 2008,
  },
]

// Seções que não fazem parte da narrativa/conteúdo do jogo
const IGNORAR = new Set([
  'references',
  'external links',
  'notes',
  'see also',
  'further reading',
  'bibliography',
  'footnotes',
  'sources',
])

const USER_AGENT = 'mgs-guia/0.1 (projeto educacional; contato no repositório)'

function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Remove marcas de referência [1], [nota 2] etc. e normaliza espaços
function limparTexto(texto) {
  return texto
    .replace(/\[[^\]]{1,20}\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function baixarArtigo(artigo) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(artigo)}`
  const resposta = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!resposta.ok) {
    throw new Error(`Falha ao baixar "${artigo}": HTTP ${resposta.status}`)
  }
  return { html: await resposta.text(), url }
}

// Cada <section data-mw-section-id> tem um h2/h3 como filho direto.
// O texto da seção são os filhos diretos p/ul/ol/dl (sem as subseções aninhadas).
function extrairSecoes(html) {
  const $ = cheerio.load(html)
  const secoes = []
  let h2Atual = null

  $('section[data-mw-section-id]').each((_, el) => {
    const sec = $(el)
    const cabecalho = sec.children('h2, h3').first()
    const nivel = cabecalho.length ? Number(cabecalho.prop('tagName').slice(1)) : 0

    const paragrafos = []
    sec.children('p, ul, ol, dl').each((__, bloco) => {
      const texto = limparTexto($(bloco).text())
      if (texto) paragrafos.push(texto)
    })

    // Seção de introdução (sem cabeçalho)
    if (nivel === 0) {
      if (paragrafos.length) {
        secoes.push({ tituloOriginal: null, nivel: 0, paragrafos })
      }
      return
    }

    const titulo = limparTexto(cabecalho.text())
    if (IGNORAR.has(titulo.toLowerCase())) return

    if (nivel === 2) h2Atual = titulo
    secoes.push({
      tituloOriginal: titulo,
      nivel,
      pai: nivel === 3 ? h2Atual : null,
      paragrafos,
    })
  })

  return secoes
}

// Gera IDs estáveis: "mgs2/synopsis" ou "mgs2/synopsis/setting".
// Só depende do título em inglês, então não muda com a tradução.
function montarIds(jogoId, secoes) {
  const usados = new Map()
  let pai = null

  return secoes.map((secao, indice) => {
    if (secao.nivel === 0) {
      return { ...secao, id: `${jogoId}/introducao`, ordem: indice }
    }
    const partes = [slugify(secao.nivel === 3 ? secao.pai : secao.tituloOriginal)]
    if (secao.nivel === 3) partes.push(slugify(secao.tituloOriginal))
    if (secao.nivel === 2) pai = partes[0]

    let id = `${jogoId}/${partes.join('/')}`
    const repeticoes = usados.get(id) ?? 0
    usados.set(id, repeticoes + 1)
    if (repeticoes > 0) id = `${id}-${repeticoes + 1}`

    return { ...secao, id, ordem: indice }
  })
}

async function main() {
  await mkdir(pastaSaida, { recursive: true })
  const dataColeta = new Date().toISOString().slice(0, 10)

  for (const jogo of JOGOS) {
    console.log(`Baixando ${jogo.artigo}...`)
    const { html, url } = await baixarArtigo(jogo.artigo)
    const secoes = montarIds(jogo.id, extrairSecoes(html))

    const saida = {
      jogo: {
        id: jogo.id,
        titulo: jogo.titulo,
        anoLancamento: jogo.anoLancamento,
      },
      fonte: { url, dataColeta, licenca: 'CC BY-SA 4.0' },
      secoes: secoes.map(({ id, ordem, nivel, tituloOriginal, pai, paragrafos }) => ({
        id,
        ordem,
        nivel,
        pai: pai ? `${jogo.id}/${slugify(pai)}` : null,
        titulo: tituloOriginal ?? jogo.titulo,
        paragrafos,
      })),
    }

    const arquivo = path.join(pastaSaida, `${jogo.id}.json`)
    await writeFile(arquivo, JSON.stringify(saida, null, 2) + '\n', 'utf8')
    console.log(`  → ${saida.secoes.length} seções em ${path.relative(raiz, arquivo)}`)
  }
}

main().catch((erro) => {
  console.error(erro)
  process.exitCode = 1
})
