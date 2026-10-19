<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ancoraDaSecao, carregarTodosJogos, previewDaSecao, resumoDaSecao } from '../data'
import { useFavoritosStore } from '../stores/favoritos'
import ResumoModal from '../components/ResumoModal.vue'

const { t } = useI18n()
const route = useRoute()
const favoritos = useFavoritosStore()

const jogos = ref([])
const carregando = ref(true)
// Itens abertos. Começam todos recolhidos: só o título aparece até o usuário expandir.
const abertas = ref(new Set())
const resumo = ref({ aberto: false, titulo: '', texto: '' })

async function carregar() {
  carregando.value = true
  jogos.value = await carregarTodosJogos(route.params.idioma)
  carregando.value = false
}

onMounted(async () => {
  await favoritos.carregar()
  await carregar()
})

watch(() => route.params.idioma, carregar)

// Agrupa só os favoritos existentes, na ordem em que aparecem em cada jogo.
// "todas" guarda as seções do jogo inteiro, usadas para montar o resumo.
const grupos = computed(() =>
  jogos.value
    .map((jogo) => ({
      jogo: jogo.jogo,
      todas: jogo.secoes,
      secoes: jogo.secoes.filter((secao) => favoritos.estaFavoritado(secao.id)),
    }))
    .filter((grupo) => grupo.secoes.length > 0),
)

const vazio = computed(() => favoritos.carregado && !carregando.value && grupos.value.length === 0)

function recolhida(secao) {
  return !abertas.value.has(secao.id)
}

function alternar(secaoId) {
  if (abertas.value.has(secaoId)) abertas.value.delete(secaoId)
  else abertas.value.add(secaoId)
}

function abrirResumo(secao, todas) {
  const texto = resumoDaSecao(secao, todas) || t('jogo.semResumo')
  resumo.value = { aberto: true, titulo: secao.titulo, texto }
}

function fecharResumo() {
  resumo.value = { ...resumo.value, aberto: false }
}

function destinoSecao(grupo, secao) {
  return { path: `/${route.params.idioma}/jogo/${grupo.jogo.id}`, hash: `#${ancoraDaSecao(secao.id)}` }
}
</script>

<template>
  <section class="favoritos">
    <h1>{{ t('favoritos.titulo') }}</h1>

    <p v-if="vazio" class="vazio">{{ t('favoritos.vazio') }}</p>

    <div v-for="grupo in grupos" :key="grupo.jogo.id" class="grupo">
      <h2 class="titulo-grupo">{{ grupo.jogo.titulo }}</h2>

      <article v-for="secao in grupo.secoes" :key="secao.id" class="secao">
        <header class="cabecalho-secao">
          <h3 class="titulo-secao">
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
          </h3>

          <div class="acoes">
            <button type="button" class="acao-botao" @click="abrirResumo(secao, grupo.todas)">
              {{ t('jogo.resumo') }}
            </button>
            <RouterLink class="acao-botao" :to="destinoSecao(grupo, secao)">
              {{ t('favoritos.verSecao') }}
            </RouterLink>
            <button
              type="button"
              class="remover"
              :aria-label="`${t('favoritos.remover')}: ${secao.titulo}`"
              @click="favoritos.remover(secao.id)"
            >
              ✕
            </button>
          </div>
        </header>

        <div v-show="!recolhida(secao)" :id="`${ancoraDaSecao(secao.id)}-conteudo`" class="conteudo-secao">
          <!-- Preview de até 200 caracteres; o texto completo fica na seção -->
          <p class="preview">{{ previewDaSecao(secao) }}</p>
        </div>
      </article>
    </div>

    <ResumoModal
      :aberto="resumo.aberto"
      :titulo="resumo.titulo"
      :texto="resumo.texto"
      :rotulo-fechar="t('jogo.resumoFechar')"
      @fechar="fecharResumo"
    />
  </section>
</template>

<style scoped>
.favoritos {
  min-width: 0;
}

.favoritos h1 {
  margin-top: 0;
}

.vazio {
  color: var(--cor-texto-suave);
}

/* Grupo por jogo: título em destaque com linha metálica */
.grupo {
  margin-bottom: 2rem;
}

.titulo-grupo {
  font-size: 1.2rem;
  color: var(--cor-destaque);
  border-bottom: 2px solid var(--cor-borda);
  padding-bottom: 0.3rem;
  margin: 0 0 0.9rem;
}

/* Item como painel metálico, igual às seções da página do jogo */
.secao {
  min-width: 0;
  margin-bottom: 0.9rem;
  background: var(--cor-cartao);
  border: 2px solid #2b3024;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 14px rgba(0, 0, 0, 0.4);
}

.cabecalho-secao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  flex-wrap: wrap;
}

.titulo-secao {
  margin: 0;
  font-size: 1.05rem;
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

/* Botões de placa metálica, como nas outras páginas */
.acao-botao {
  display: inline-block;
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
  text-decoration: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
}

.acao-botao:hover {
  border-color: var(--cor-destaque);
}

.remover {
  background: var(--cor-metal);
  border: 1px solid #6b7452;
  border-radius: 4px;
  color: var(--cor-texto-suave);
  padding: 0.25rem 0.55rem;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
}

.remover:hover {
  color: #e0866f;
  border-color: #a33a2a;
}

.conteudo-secao {
  padding: 0 0.9rem 0.9rem;
}

.conteudo-secao p {
  margin: 0.6rem 0 0;
  overflow-wrap: anywhere;
}
</style>
