<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section>
    <h1>{{ t('erro.paginaNaoEncontrada') }}</h1>
    <RouterLink to="/">{{ t('erro.voltarInicio') }}</RouterLink>
  </section>
</template>
