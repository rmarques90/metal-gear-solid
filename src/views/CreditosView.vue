<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { carregarTimeline, carregarTodosJogos } from '../data'
import capas from '../data/capas.json'

const { t } = useI18n()
const route = useRoute()

const fontes = ref([])
const imagens = ref([])
const capasCreditos = Object.values(capas).map((capa) => capa.credito)

async function carregar() {
  const jogos = await carregarTodosJogos('en')
  fontes.value = jogos.map((jogo) => ({
    titulo: jogo.jogo.titulo,
    url: jogo.fonte.url,
    dataColeta: jogo.fonte.dataColeta,
    licenca: jogo.fonte.licenca,
  }))

  const timeline = await carregarTimeline(route.params.idioma)
  imagens.value = timeline.eventos.filter((e) => e.credito).map((e) => ({ id: e.id, credito: e.credito }))
}

onMounted(carregar)
watch(() => route.params.idioma, carregar)
</script>

<template>
  <section class="creditos">
    <h1>{{ t('creditos.titulo') }}</h1>

    <h2>{{ t('creditos.textos') }}</h2>
    <p>{{ t('creditos.textosDescricao') }}</p>
    <ul>
      <li v-for="fonte in fontes" :key="fonte.url">
        <a :href="fonte.url" target="_blank" rel="noopener noreferrer">{{ fonte.titulo }}</a>
        <span class="suave">
          · {{ t('creditos.coletadoEm') }} {{ fonte.dataColeta }} · {{ t('creditos.licenca') }}: {{ fonte.licenca }}
        </span>
      </li>
    </ul>

    <h2>{{ t('creditos.imagens') }}</h2>
    <p>{{ t('creditos.imagensDescricao') }}</p>
    <ul>
      <li v-for="capa in capasCreditos" :key="capa">{{ capa }}</li>
      <li>{{ t('creditos.icone') }}</li>
      <li v-for="imagem in imagens" :key="imagem.id">{{ imagem.credito }}</li>
    </ul>
  </section>
</template>

<style scoped>
.suave {
  color: var(--cor-texto-suave);
  font-size: 0.9rem;
}

li {
  margin-bottom: 0.4rem;
}
</style>
