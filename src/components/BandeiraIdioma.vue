<script setup>
// Bandeiras em SVG: emojis de bandeira aparecem como letras no Windows
defineProps({
  codigo: { type: String, default: '' },
})

// Estados Unidos: 13 listras e cantão (estrelas simplificadas)
const LISTRAS = Array.from({ length: 13 }, (_, i) => ({
  y: i * (28 / 13),
  cor: i % 2 === 0 ? '#b22234' : '#ffffff',
}))
</script>

<template>
  <svg v-if="codigo === 'br'" class="bandeira" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
    <rect width="40" height="28" fill="#009c3b" />
    <polygon points="20,3 37,14 20,25 3,14" fill="#ffdf00" />
    <circle cx="20" cy="14" r="6" fill="#002776" />
  </svg>

  <svg v-else-if="codigo === 'us'" class="bandeira" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
    <rect v-for="listra in LISTRAS" :key="listra.y" x="0" :y="listra.y" width="40" :height="28 / 13" :fill="listra.cor" />
    <rect width="18" height="15" fill="#3c3b6e" />
  </svg>
</template>

<style scoped>
.bandeira {
  width: 22px;
  height: 15px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
}
</style>
