<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BandeiraIdioma from './BandeiraIdioma.vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  opcoes: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const aberto = ref(false)
const raiz = ref(null)

const atual = computed(() => props.opcoes.find((o) => o.codigo === props.modelValue))

function escolher(codigo) {
  aberto.value = false
  if (codigo !== props.modelValue) emit('update:modelValue', codigo)
}

// Fecha ao clicar fora ou apertar Esc
function aoClicarFora(evento) {
  if (raiz.value && !raiz.value.contains(evento.target)) aberto.value = false
}

function aoApertarTecla(evento) {
  if (evento.key === 'Escape') aberto.value = false
}

onMounted(() => {
  document.addEventListener('click', aoClicarFora)
  document.addEventListener('keydown', aoApertarTecla)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', aoClicarFora)
  document.removeEventListener('keydown', aoApertarTecla)
})
</script>

<template>
  <div ref="raiz" class="seletor">
    <button
      type="button"
      class="gatilho"
      aria-haspopup="listbox"
      :aria-expanded="aberto"
      :aria-label="t('nav.idioma')"
      @click="aberto = !aberto"
    >
      <BandeiraIdioma :codigo="atual?.bandeira" />
      <span>{{ atual?.rotulo }}</span>
      <span class="seta" :class="{ aberta: aberto }" aria-hidden="true">▾</span>
    </button>

    <ul v-if="aberto" class="lista" role="listbox" :aria-label="t('nav.idioma')">
      <li
        v-for="opcao in opcoes"
        :key="opcao.codigo"
        role="option"
        :aria-selected="opcao.codigo === modelValue"
        class="item"
        :class="{ selecionado: opcao.codigo === modelValue }"
        tabindex="0"
        @click="escolher(opcao.codigo)"
        @keydown.enter.prevent="escolher(opcao.codigo)"
        @keydown.space.prevent="escolher(opcao.codigo)"
      >
        <BandeiraIdioma :codigo="opcao.bandeira" />
        <span>{{ opcao.nome }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.seletor {
  position: relative;
}

.gatilho {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--cor-metal);
  color: var(--cor-texto);
  border: 1px solid #6b7452;
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
  padding: 0.35rem 0.75rem 0.35rem 0.4rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.gatilho:hover {
  border-color: var(--cor-destaque);
}

.seta {
  color: var(--cor-texto-suave);
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.seta.aberta {
  transform: rotate(180deg);
}

.lista {
  position: absolute;
  right: 0;
  top: calc(100% + 0.4rem);
  min-width: 180px;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  background: var(--cor-cartao);
  border: 1px solid var(--cor-borda);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 10;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.item:hover,
.item:focus-visible {
  background: rgba(212, 175, 55, 0.12);
}

.item.selecionado {
  color: var(--cor-destaque);
  font-weight: 600;
}

.bandeira {
  width: 22px;
  height: 15px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
}
</style>
