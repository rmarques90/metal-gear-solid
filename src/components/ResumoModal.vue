<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  aberto: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  texto: { type: String, default: '' },
  rotuloFechar: { type: String, default: 'Fechar' },
})

const emit = defineEmits(['fechar'])

const botaoFechar = ref(null)

// Esc fecha o popup
function aoApertarTecla(evento) {
  if (props.aberto && evento.key === 'Escape') emit('fechar')
}

// Ao abrir, o foco vai para o botão de fechar (acessível por teclado)
watch(
  () => props.aberto,
  async (aberto) => {
    if (aberto) {
      await nextTick()
      botaoFechar.value?.focus()
    }
  },
)

onMounted(() => document.addEventListener('keydown', aoApertarTecla))
onBeforeUnmount(() => document.removeEventListener('keydown', aoApertarTecla))
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="fundo" @click.self="emit('fechar')">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="titulo">
        <h2>{{ titulo }}</h2>
        <p>{{ texto }}</p>
        <button ref="botaoFechar" type="button" class="fechar" @click="emit('fechar')">
          {{ rotuloFechar }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fundo {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(5, 6, 4, 0.72);
  backdrop-filter: blur(3px);
}

/* Popup como painel metálico, no mesmo estilo dos cards */
.modal {
  width: min(520px, 100%);
  padding: 1.5rem;
  background: var(--cor-cartao);
  border: 2px solid #2b3024;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 16px 40px rgba(0, 0, 0, 0.7);
}

.modal h2 {
  margin: 0 0 0.75rem;
  font-size: 1.4rem;
  color: var(--cor-destaque);
}

.modal p {
  margin: 0 0 1.25rem;
  line-height: 1.6;
}

.fechar {
  background: var(--cor-metal);
  color: var(--cor-texto);
  border: 1px solid #6b7452;
  border-radius: 4px;
  padding: 0.45rem 1.1rem;
  cursor: pointer;
  font-family: var(--fonte-titulo);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 0 var(--cor-borda-escura);
}

.fechar:hover {
  border-color: var(--cor-destaque);
}
</style>
