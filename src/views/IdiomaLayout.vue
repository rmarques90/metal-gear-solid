<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SeletorIdioma from '../components/SeletorIdioma.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const ANO_CRIACAO = 2026

const idioma = computed(() => route.params.idioma)

const OPCOES_IDIOMA = [
  { codigo: 'pt-BR', nome: 'Português (Brasil)', rotulo: 'PT-BR', bandeira: 'br' },
  { codigo: 'en', nome: 'English', rotulo: 'EN', bandeira: 'us' },
]

// Troca o idioma mantendo a mesma página na URL
function trocarIdioma(novo) {
  router.push({ ...route, params: { ...route.params, idioma: novo } })
}
</script>

<template>
  <div class="layout">
    <header class="cabecalho">
      <nav class="menu" :aria-label="t('nav.inicio')">
        <RouterLink :to="`/${idioma}`" class="link-menu" exact-active-class="ativo">{{ t('nav.inicio') }}</RouterLink>
        <RouterLink :to="`/${idioma}/timeline`" class="link-menu" active-class="ativo">{{ t('nav.timeline') }}</RouterLink>
        <RouterLink :to="`/${idioma}/favoritos`" class="link-menu" active-class="ativo">{{ t('nav.favoritos') }}</RouterLink>
        <RouterLink :to="`/${idioma}/sobre`" class="link-menu" active-class="ativo">{{ t('nav.sobre') }}</RouterLink>
      </nav>

      <SeletorIdioma :model-value="idioma" :opcoes="OPCOES_IDIOMA" @update:model-value="trocarIdioma" />
    </header>

    <main class="conteudo">
      <RouterView />
    </main>

    <footer class="rodape">
      <p>
        <RouterLink :to="`/${idioma}/sobre`">{{ t('nav.sobre') }}</RouterLink>
        ·
        <RouterLink :to="`/${idioma}/creditos`">{{ t('rodape.creditos') }}</RouterLink>
      </p>
      <p class="criado-em">{{ t('rodape.criadoEm', { ano: ANO_CRIACAO }) }}</p>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.cabecalho {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1.5rem;
  background: linear-gradient(180deg, #454d36 0%, #252a1d 100%);
  border-bottom: 2px solid var(--cor-borda-escura);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.5);
}

.menu {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

/* Botões de menu como placas metálicas; a seção ativa acende em âmbar */
.menu .link-menu {
  padding: 0.4rem 1rem;
  border-radius: 4px;
  border: 1px solid #6b7452;
  background: var(--cor-metal);
  color: var(--cor-texto);
  text-decoration: none;
  font-family: var(--fonte-titulo);
  font-size: 1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 0 var(--cor-borda-escura);
  transition: color 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
}

.menu .link-menu:hover {
  filter: brightness(1.15);
}

.menu .link-menu.ativo {
  color: #ffd27a;
  border-color: var(--cor-destaque);
  text-shadow: 0 0 8px rgba(227, 169, 59, 0.6);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 10px rgba(227, 169, 59, 0.35);
}

.conteudo {
  flex: 1;
  padding: 1.5rem;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.rodape {
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  font-size: 0.85rem;
  color: var(--cor-texto-suave);
  background: linear-gradient(180deg, #373d2c 0%, #1f231a 100%);
  border-top: 2px solid var(--cor-borda);
  text-align: center;
}

.rodape p {
  margin: 0.2rem 0;
}

.rodape a {
  color: var(--cor-texto-suave);
}

.rodape a:hover {
  color: var(--cor-destaque);
}

.criado-em {
  font-family: var(--fonte-terminal);
  font-size: 0.8rem;
  color: var(--cor-verde);
  opacity: 0.85;
}

@media (max-width: 720px) {
  .cabecalho {
    flex-direction: column;
    align-items: stretch;
  }

  .menu {
    justify-content: center;
  }
}
</style>
