<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ancoraDaSecao, carregarJogo, resumoDaSecao } from '../data'
import { useFavoritosStore } from '../stores/favoritos'
import ResumoModal from '../components/ResumoModal.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const { t, locale } = useI18n()
const route = useRoute()
const favoritos = useFavoritosStore()

const jogo = ref(null)
const carregando = ref(true)
// IDs das seções recolhidas (o conteúdo fica oculto; o título continua visível)
const recolhidas = ref(new Set())
const resumo = ref({ aberto: false, titulo: '', texto: '' })

const secoes = computed(() => jogo.value?.secoes ?? [])

// Seção de nível 2 recolhida oculta as subseções (nível 3) que dependem dela
function visivel(secao) {
  return !(secao.pai && recolhidas.value.has(secao.pai))
}

function recolhida(secao) {
  return recolhidas.value.has(secao.id)
}

function alternar(secaoId) {
  if (recolhidas.value.has(secaoId)) recolhidas.value.delete(secaoId)
  else recolhidas.value.add(secaoId)
}

function expandir(secaoId) {
  recolhidas.value.delete(secaoId)
}

// Seção vem no hash (ex.: #mgs1--synopsis--plot); parágrafo relevante vem em ?paragrafo=N
const ancoraAtiva = computed(() => route.hash.slice(1))

function destacado(secao, indice) {
  return (
    route.query.paragrafo !== undefined &&
    ancoraDaSecao(secao.id) === ancoraAtiva.value &&
    Number(route.query.paragrafo) === indice
  )
}

// Garante que a seção destacada esteja aberta, senão o parágrafo não aparece
function abrirSecaoDestacada() {
  const secao = secoes.value.find((s) => ancoraDaSecao(s.id) === ancoraAtiva.value)
  if (!secao) return
  if (secao.pai) expandir(secao.pai)
  expandir(secao.id)
}

// Rola até um elemento depois que o DOM atualizar
async function rolarPara(seletor) {
  await nextTick()
  document.querySelector(seletor)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// O router rola para o hash antes do texto carregar; por isso rola de novo aqui
async function rolarParaDestaque() {
  await nextTick()
  const alvo =
    document.querySelector('.paragrafo.destaque') ?? document.getElementById(ancoraAtiva.value)
  alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function carregar() {
  carregando.value = true
  jogo.value = await carregarJogo(route.params.idioma, props.id)
  carregando.value = false
  abrirSecaoDestacada()
  await rolarParaDestaque()
}

// Clique no sumário: abre a seção (e o pai, se estiver recolhido) e rola até ela
async function irParaSecao(secao) {
  if (secao.pai) expandir(secao.pai)
  expandir(secao.id)
  await rolarPara(`#${ancoraDaSecao(secao.id)}`)
}

function abrirResumo(secao) {
  const texto = resumoDaSecao(secao, secoes.value) || t('jogo.semResumo')
  resumo.value = { aberto: true, titulo: secao.titulo, texto }
}

function fecharResumo() {
  resumo.value = { ...resumo.value, aberto: false }
}

onMounted(() => {
  favoritos.carregar()
  carregar()
})

// Recarrega o texto quando o idioma muda (ou o jogo na URL)
watch(() => [route.params.idioma, props.id], carregar)

// Mesmo jogo, outro destino (ex.: outro evento da timeline)
watch(
  () => route.fullPath,
  () => {
    abrirSecaoDestacada()
    rolarParaDestaque()
  },
)

watch(locale, () => {
  resumo.value = { ...resumo.value, aberto: false }
})
</script>

<template>
  <section v-if="carregando" class="estado">…</section>

  <section v-else-if="!jogo">
    <h1>{{ t('jogo.naoEncontrado') }}</h1>
  </section>

  <article v-else class="jogo">
    <header class="jogo-cabecalho">
      <h1>{{ jogo.jogo.titulo }}</h1>
      <p class="ano">{{ jogo.jogo.anoLancamento }}</p>

      <p v-if="jogo.fallback" class="aviso" role="status">
        {{ t('jogo.traducaoIndisponivel') }}
      </p>
    </header>

    <div class="corpo">
      <nav class="sumario" :aria-label="t('jogo.sumario')">
        <h2>{{ t('jogo.sumario') }}</h2>
        <ul>
          <li
            v-for="secao in secoes.filter((s) => s.nivel === 2 || s.nivel === 3)"
            :key="secao.id"
            :class="`nivel-${secao.nivel}`"
          >
            <button type="button" class="botao-sumario" @click="irParaSecao(secao)">
              {{ secao.titulo }}
            </button>
          </li>
        </ul>
      </nav>

      <div class="secoes">
        <section
          v-for="secao in secoes"
          v-show="visivel(secao)"
          :id="ancoraDaSecao(secao.id)"
          :key="secao.id"
          class="secao"
          :class="`nivel-${secao.nivel}`"
        >
          <header class="cabecalho-secao">
            <component :is="secao.nivel === 3 ? 'h3' : 'h2'" class="titulo-secao">
              <button
                type="button"
                class="recolher"
                :aria-expanded="!recolhida(secao)"
                :aria-controls="`${ancoraDaSecao(secao.id)}-conteudo`"
                @click="alternar(secao.id)"
              >
                <span class="seta" :class="{ fechada: recolhida(secao) }" aria-hidden="true">▾</span>
                {{ secao.titulo }}
              </button>
            </component>

            <div class="acoes">
              <button type="button" class="acao-botao" @click="abrirResumo(secao)">
                {{ t('jogo.resumo') }}
              </button>
              <button
                type="button"
                class="favorito"
                :class="{ ativo: favoritos.estaFavoritado(secao.id) }"
                :aria-pressed="favoritos.estaFavoritado(secao.id)"
                :aria-label="secao.titulo"
                @click="favoritos.alternar(secao.id)"
              >
                {{ favoritos.estaFavoritado(secao.id) ? '★' : '☆' }}
              </button>
            </div>
          </header>

          <div v-show="!recolhida(secao)" :id="`${ancoraDaSecao(secao.id)}-conteudo`" class="conteudo-secao">
            <p
              v-for="(paragrafo, indice) in secao.paragrafos"
              :key="indice"
              class="paragrafo"
              :class="{ destaque: destacado(secao, indice) }"
            >
              {{ paragrafo }}
            </p>
          </div>
        </section>
      </div>
    </div>

    <ResumoModal
      :aberto="resumo.aberto"
      :titulo="resumo.titulo"
      :texto="resumo.texto"
      :rotulo-fechar="t('jogo.resumoFechar')"
      @fechar="fecharResumo"
    />
  </article>
</template>

<style scoped>
.estado {
  color: var(--cor-texto-suave);
}

.jogo-cabecalho {
  margin-bottom: 1.5rem;
}

.ano {
  font-family: var(--fonte-terminal);
  color: var(--cor-verde);
  margin: 0;
}

.aviso {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--cor-destaque);
  background: var(--cor-cartao);
  font-size: 0.9rem;
}

.corpo {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 2rem;
  align-items: start;
}

/* Sumário como botões metálicos; subseções são menores e recuadas */
.sumario {
  position: sticky;
  top: 5rem;
}

.sumario h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
  color: var(--cor-destaque);
}

.sumario ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sumario li.nivel-3 {
  padding-left: 0.9rem;
}

.botao-sumario {
  width: 100%;
  text-align: left;
  background: var(--cor-metal);
  color: var(--cor-texto);
  border: 1px solid #6b7452;
  border-radius: 4px;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  font-family: var(--fonte-titulo);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
}

.nivel-3 .botao-sumario {
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  color: var(--cor-texto-suave);
}

.botao-sumario:hover {
  border-color: var(--cor-destaque);
  color: var(--cor-destaque);
}

/* Seções como painéis; cabeçalho com título (recolher) à esquerda e ações à direita */
.secao {
  position: relative;
  margin-bottom: 0.9rem;
  background: var(--cor-cartao);
  border: 2px solid #2b3024;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 14px rgba(0, 0, 0, 0.4);
  scroll-margin-top: 6rem;
}

.secao.nivel-3 {
  margin-left: 1.25rem;
  background: rgba(0, 0, 0, 0.18);
}

.cabecalho-secao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
}

.titulo-secao {
  margin: 0;
  font-size: 1.2rem;
}

.nivel-3 .titulo-secao {
  font-size: 1rem;
}

.recolher {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  text-align: left;
}

.recolher:hover {
  color: var(--cor-destaque);
}

.seta {
  display: inline-block;
  color: var(--cor-destaque);
  transition: transform 0.2s ease;
}

.seta.fechada {
  transform: rotate(-90deg);
}

.acoes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.acao-botao {
  background: var(--cor-metal);
  color: var(--cor-texto);
  border: 1px solid #6b7452;
  border-radius: 4px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
  font-family: var(--fonte-titulo);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.85rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
}

.acao-botao:hover {
  border-color: var(--cor-destaque);
}

.conteudo-secao {
  padding: 0 0.9rem 0.9rem;
}

.conteudo-secao p {
  margin: 0.6rem 0 0;
}

/* Parágrafo relevante ao evento da timeline */
.paragrafo.destaque {
  background: rgba(227, 169, 59, 0.14);
  border-left: 3px solid var(--cor-destaque);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  transition: background 0.6s ease;
}

.favorito {
  background: none;
  border: 1px solid #6b7452;
  border-radius: 4px;
  color: var(--cor-texto-suave);
  padding: 0.2rem 0.55rem;
  cursor: pointer;
}

.favorito.ativo {
  color: var(--cor-destaque);
  border-color: var(--cor-destaque);
}

@media (max-width: 720px) {
  .corpo {
    grid-template-columns: 1fr;
  }

  .sumario {
    position: static;
  }

  .secao.nivel-3 {
    margin-left: 0.5rem;
  }
}
</style>
