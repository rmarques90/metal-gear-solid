<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section class="sobre">
    <h1>{{ t('sobre.titulo') }}</h1>
    <p>{{ t('sobre.oQue') }}</p>
    <p>{{ t('sobre.fonte') }}</p>
    <p>{{ t('sobre.imagens') }}</p>
    <p class="projeto">{{ t('sobre.projeto') }}</p>
  </section>
</template>

<style scoped>
.sobre p {
  max-width: 70ch;
}

.projeto {
  color: var(--cor-texto-suave);
  font-size: 0.9rem;
}
</style>
