<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { carregarTodosJogos } from '../data'
import capas from '../data/capas.json'

const { t } = useI18n()
const route = useRoute()

const jogos = ref([])

// Capas locais: o build resolve os arquivos em src/assets/capas
const imagens = import.meta.glob('../assets/capas/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

function urlCapa(jogoId) {
  const arquivo = capas[jogoId]?.arquivo
  return arquivo ? imagens[`../assets/capas/${arquivo}`] : null
}

async function carregar() {
  jogos.value = await carregarTodosJogos(route.params.idioma)
}

onMounted(carregar)
watch(() => route.params.idioma, carregar)
</script>

<template>
  <section>
    <h1>{{ t('home.titulo') }}</h1>
    <p class="resumo">{{ t('home.resumo') }}</p>

    <div class="cards">
      <RouterLink
        v-for="jogo in jogos"
        :key="jogo.jogo.id"
        :to="`/${route.params.idioma}/jogo/${jogo.jogo.id}`"
        class="card"
      >
        <div class="capa">
          <div class="capa-tela">
            <img
              v-if="urlCapa(jogo.jogo.id)"
              :src="urlCapa(jogo.jogo.id)"
              :alt="jogo.jogo.titulo"
              class="capa-imagem"
            />
          </div>
        </div>
        <div class="texto">
          <span class="ano">{{ jogo.jogo.anoLancamento }}</span>
          <strong>{{ jogo.jogo.titulo }}</strong>
          <span class="acao">{{ t('home.abrir') }} →</span>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
/* Título de abertura com gradiente claro, como o do template */
h1 {
  background: linear-gradient(180deg, #f4efd0 0%, #9c9d7e 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
  font-size: clamp(2rem, 5vw, 3.2rem);
}

/* Mesma largura da grade de cards */
.resumo {
  color: var(--cor-texto-suave);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Card como equipamento metálico: moldura com brilho no topo e sombra */
.card {
  display: flex;
  flex-direction: column;
  background: var(--cor-metal);
  border: 2px solid #2b3024;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: var(--cor-texto);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 16px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.card:hover {
  border-color: var(--cor-destaque);
  transform: translateY(-2px);
}

/* Bezel de monitor: moldura metálica escura ao redor da tela */
/* A proporção vem só do bezel: a imagem fica absoluta, então não altera a altura do card */
.capa {
  position: relative;
  aspect-ratio: 3 / 4;
  margin: 10px 10px 0;
  border-radius: 10px;
  background: linear-gradient(180deg, #2c3324 0%, #171b12 100%);
  border: 2px solid #0e110a;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -2px 4px rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
}

/* Vidro da tela: capa dentro, com contain para não cortar o logo */
.capa-tela {
  position: absolute;
  inset: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background: #050604;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.9);
}

.capa-imagem {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 0;
}

/* Efeitos de tela: linhas de varredura, vinheta e reflexo diagonal */
.capa-tela::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18) 0 1px, transparent 1px 3px),
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
}

.capa-tela::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 38%);
}

.texto {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.25rem 1.25rem;
}

/* Altura fixa para duas linhas: títulos curtos e longos ficam alinhados */
.card strong {
  font-size: 1.05rem;
  min-height: 2.6em;
  line-height: 1.3;
}

/* Ano em verde de monitor, como o registro do template */
.ano {
  font-family: var(--fonte-terminal);
  color: var(--cor-verde);
  font-size: 0.85rem;
}

.acao {
  font-family: var(--fonte-terminal);
  color: var(--cor-destaque);
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-top: auto;
}
</style>
