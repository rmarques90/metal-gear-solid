<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ancoraDaSecao, carregarTimeline } from '../data'

const { t } = useI18n()
const route = useRoute()

// Tempo que cada evento fica em destaque durante a reprodução automática
const INTERVALO_MS = 4000
// Frequência de atualização da barra de progresso (suave, sem saltos por evento)
const TICK_MS = 50

const LARGURA = 1000
const MARGEM = 60
const EIXO_Y = 100

const NOMES_JOGOS = {
  mgs1: 'Metal Gear Solid',
  mgs2: 'Metal Gear Solid 2: Sons of Liberty',
  mgs3: 'Metal Gear Solid 3: Snake Eater',
  mgs4: 'Metal Gear Solid 4: Guns of the Patriots',
}

const CORES_JOGOS = {
  mgs1: '#e0b43c',
  mgs2: '#4aa3df',
  mgs3: '#6aa84f',
  mgs4: '#c0504d',
}

// Imagens locais: o build resolve os arquivos em src/assets/timeline
const imagens = import.meta.glob('../assets/timeline/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

function urlImagem(caminho) {
  if (!caminho) return null
  const nome = caminho.split('/').pop()
  return imagens[`../assets/timeline/${nome}`] ?? null
}

const timeline = ref(null)
const indice = ref(0)
// Fração (0 a 1) do tempo do evento atual já decorrida durante a reprodução
const fracaoEvento = ref(0)
const tocando = ref(false)
let temporizador = null

// Cronologia da história: eventos ordenados pelo ano na narrativa e pela sequência dentro do ano
const eventos = computed(() =>
  [...(timeline.value?.eventos ?? [])].sort(
    (a, b) =>
      a.anoHistoria - b.anoHistoria ||
      (a.ordemHistoria ?? 0) - (b.ordemHistoria ?? 0) ||
      a.anoLancamento - b.anoLancamento,
  ),
)

const larguraUtil = LARGURA - 2 * MARGEM

// Espaçamento igual por sequência: eventos do mesmo ano não se sobrepõem
const nos = computed(() => {
  const total = eventos.value.length
  return eventos.value.map((evento, i) => ({
    evento,
    x: MARGEM + (total > 1 ? (i / (total - 1)) * larguraUtil : larguraUtil / 2),
    y: EIXO_Y + (i % 2 === 0 ? -55 : 55),
    cor: CORES_JOGOS[evento.jogoId],
  }))
})

// Marca o ano no eixo sempre que a narrativa muda de ano
const anos = computed(() =>
  nos.value
    .filter((no, i) => i === 0 || nos.value[i - 1].evento.anoHistoria !== no.evento.anoHistoria)
    .map((no) => ({ ano: no.evento.anoHistoria, x: no.x })),
)

const eventoAtual = computed(() => eventos.value[indice.value] ?? null)

// Progresso geral da timeline: evento atual somado à fração já percorrida dele
const progressoTotal = computed(() => {
  const total = eventos.value.length
  if (total === 0) return 0
  if (total === 1) return 1
  return Math.min((indice.value + fracaoEvento.value) / (total - 1), 1)
})

const progressoPercentual = computed(() => Math.round(progressoTotal.value * 100))

function irPara(novoIndice) {
  const total = eventos.value.length
  if (!total) return
  indice.value = ((novoIndice % total) + total) % total
  fracaoEvento.value = 0
}

function proximo() {
  irPara(indice.value + 1)
}

function anterior() {
  irPara(indice.value - 1)
}

function alternarPlay() {
  tocando.value = !tocando.value
}

// Avança a fração a cada tick; ao completar o intervalo, passa para o próximo evento
function tick() {
  fracaoEvento.value += TICK_MS / INTERVALO_MS
  if (fracaoEvento.value >= 1) proximo()
}

watch(tocando, (ativo) => {
  clearInterval(temporizador)
  if (ativo) temporizador = setInterval(tick, TICK_MS)
})

function teclado(evento) {
  if (evento.key === 'ArrowRight') proximo()
  if (evento.key === 'ArrowLeft') anterior()
  if (evento.key === ' ') {
    evento.preventDefault()
    alternarPlay()
  }
}

async function carregar() {
  timeline.value = await carregarTimeline(route.params.idioma)
  indice.value = 0
  fracaoEvento.value = 0
}

onMounted(carregar)
watch(() => route.params.idioma, carregar)
onUnmounted(() => clearInterval(temporizador))

const linkSecao = computed(() => {
  const evento = eventoAtual.value
  if (!evento) return null
  // A seção vai no hash e o parágrafo relevante na query, para a página do jogo destacá-lo
  return {
    path: `/${route.params.idioma}/jogo/${evento.jogoId}`,
    hash: `#${ancoraDaSecao(evento.secaoId)}`,
    query: { paragrafo: evento.paragrafo },
  }
})
</script>

<template>
  <section class="timeline">
    <header class="topo">
      <h1>{{ t('timeline.titulo') }}</h1>
      <p class="descricao">{{ t('timeline.descricao') }}</p>
    </header>

    <p v-if="timeline?.fallback" class="aviso" role="status">
      {{ t('jogo.traducaoIndisponivel') }}
    </p>

    <div
      class="painel"
      tabindex="0"
      role="group"
      :aria-label="t('timeline.titulo')"
      @keydown="teclado"
    >
      <svg viewBox="0 0 1000 200" class="grafico" role="img" :aria-label="t('timeline.titulo')">
        <!-- Eixo e marcas de ano -->
        <line :x1="MARGEM" :x2="LARGURA - MARGEM" :y1="EIXO_Y" :y2="EIXO_Y" class="eixo" />
        <g v-for="marca in anos" :key="`${marca.ano}-${marca.x}`">
          <line :x1="marca.x" :x2="marca.x" :y1="EIXO_Y - 4" :y2="EIXO_Y + 4" class="marca" />
          <text :x="marca.x" :y="EIXO_Y + 22" class="ano-texto">{{ marca.ano }}</text>
        </g>

        <!-- Progresso acompanha a reprodução -->
        <line
          :x1="MARGEM"
          :x2="MARGEM + progressoTotal * larguraUtil"
          :y1="EIXO_Y"
          :y2="EIXO_Y"
          class="progresso"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progressoPercentual"
          :aria-label="t('timeline.progresso')"
        />

        <!-- Nós dos eventos -->
        <g
          v-for="(no, i) in nos"
          :key="no.evento.id"
          class="no"
          :class="{ ativo: i === indice }"
          role="button"
          tabindex="-1"
          :aria-label="no.evento.titulo"
          @click="irPara(i)"
        >
          <line :x1="no.x" :x2="no.x" :y1="EIXO_Y" :y2="no.y" :stroke="no.cor" class="haste" />
          <circle :cx="no.x" :cy="no.y" r="9" :fill="no.cor" class="bolinha" />
        </g>
      </svg>

      <div class="legenda">
        <span v-for="(nome, codigo) in NOMES_JOGOS" :key="codigo">
          <i :style="{ background: CORES_JOGOS[codigo] }"></i>{{ nome }}
        </span>
      </div>

      <!-- Controles e progresso ficam juntos, logo abaixo do gráfico -->
      <div class="reprodutor">
        <div class="controles">
          <button type="button" :aria-label="t('timeline.anterior')" @click="anterior">⏮</button>
          <button
            type="button"
            class="play"
            :aria-label="tocando ? t('timeline.pausar') : t('timeline.play')"
            @click="alternarPlay"
          >
            {{ tocando ? '⏸' : '▶' }}
          </button>
          <button type="button" :aria-label="t('timeline.proximo')" @click="proximo">⏭</button>
          <span class="contador">{{ indice + 1 }} / {{ eventos.length }}</span>
        </div>
      </div>
    </div>

    <article v-if="eventoAtual" class="detalhe">
      <!-- Moldura de proporção fixa: capas e screenshots ocupam o mesmo espaço -->
      <div class="moldura">
        <img
          v-if="urlImagem(eventoAtual.imagem)"
          :src="urlImagem(eventoAtual.imagem)"
          :alt="eventoAtual.titulo"
          class="imagem"
        />
      </div>
      <div class="texto">
        <p class="meta">
          <span>{{ NOMES_JOGOS[eventoAtual.jogoId] }}</span>
          <span>{{ eventoAtual.anoHistoria }} ({{ t('timeline.anoHistoria') }})</span>
        </p>
        <h2>{{ eventoAtual.titulo }}</h2>
        <p>{{ eventoAtual.descricao }}</p>
        <RouterLink v-if="linkSecao" :to="linkSecao">{{ t('timeline.verSecao') }}</RouterLink>
        <p v-if="eventoAtual.credito" class="credito">{{ eventoAtual.credito }}</p>
      </div>
    </article>

  </section>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topo h1 {
  margin: 0;
}

.aviso {
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--cor-destaque);
  background: var(--cor-cartao);
  font-size: 0.9rem;
  margin: 0;
}

/* Gráfico, legenda e reprodutor formam um único painel */
.painel {
  background: var(--cor-cartao);
  border: 2px solid #2b3024;
  border-radius: 8px;
  padding: 1rem 1rem 0.75rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 16px rgba(0, 0, 0, 0.45);
}

.grafico {
  width: 100%;
  height: auto;
  display: block;
}

.eixo {
  stroke: var(--cor-borda);
  stroke-width: 2;
}

.progresso {
  stroke: var(--cor-destaque);
  stroke-width: 3;
}

.marca {
  stroke: var(--cor-texto-suave);
}

.ano-texto {
  fill: var(--cor-texto-suave);
  font-size: 13px;
  text-anchor: middle;
}

.no {
  cursor: pointer;
}

.haste {
  stroke-width: 1.5;
  opacity: 0.6;
}

.bolinha {
  stroke: var(--cor-fundo);
  stroke-width: 2;
  transition: r 0.3s ease;
}

.no.ativo .bolinha {
  r: 13;
  stroke: var(--cor-texto);
}

.legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--cor-texto-suave);
  margin-top: 0.5rem;
}

.legenda i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 0.35rem;
}

.reprodutor {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--cor-borda);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.controles {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.controles button {
  background: var(--cor-metal);
  color: var(--cor-texto);
  border: 1px solid #6b7452;
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  font-size: 1rem;
}

.controles button:hover {
  border-color: var(--cor-destaque);
}

.controles .play {
  color: var(--cor-destaque);
  min-width: 3rem;
}

.contador {
  margin-left: 0.75rem;
  font-size: 0.85rem;
  color: var(--cor-texto-suave);
  font-variant-numeric: tabular-nums;
  min-width: 4.5rem;
  text-align: center;
}

.detalhe {
  display: grid;
  grid-template-columns: minmax(200px, 320px) 1fr;
  gap: 1.5rem;
  background: var(--cor-cartao);
  border: 2px solid #2b3024;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 16px rgba(0, 0, 0, 0.45);
}

.moldura {
  aspect-ratio: 4 / 3;
  background: #0b0d11;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* contain: a imagem inteira cabe na moldura, sem cortes */
.imagem {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.meta {
  color: var(--cor-texto-suave);
  font-size: 0.85rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0;
}

.detalhe h2 {
  margin: 0.25rem 0 0.5rem;
  font-size: 1.3rem;
}

.credito {
  font-size: 0.75rem;
  color: var(--cor-texto-suave);
}

.descricao {
  color: var(--cor-texto-suave);
  font-size: 0.95rem;
  margin: 0.4rem 0 0;
}

@media (max-width: 720px) {
  .detalhe {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bolinha {
    transition: none;
  }
}
</style>
