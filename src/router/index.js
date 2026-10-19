import { createRouter, createWebHistory } from 'vue-router'
import i18n, { LOCALES, idiomaValido, detectarIdiomaNavegador } from '../i18n'
import { db } from '../db'

// Todas as rotas ficam sob /:idioma (ex.: /pt-BR/jogo/mgs2 e /en/jogo/mgs2)
const rotasBase = [
  {
    path: '',
    name: 'inicio',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: 'jogo/:id',
    name: 'jogo',
    component: () => import('../views/JogoView.vue'),
    props: true,
  },
  {
    path: 'favoritos',
    name: 'favoritos',
    component: () => import('../views/FavoritosView.vue'),
  },
  {
    path: 'timeline',
    name: 'timeline',
    component: () => import('../views/TimelineView.vue'),
  },
  {
    path: 'sobre',
    name: 'sobre',
    component: () => import('../views/SobreView.vue'),
  },
  {
    path: 'creditos',
    name: 'creditos',
    component: () => import('../views/CreditosView.vue'),
  },
  {
    path: ':pathMatch(.*)*',
    name: 'nao-encontrada',
    component: () => import('../views/NaoEncontradaView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'raiz',
      // Sem idioma na URL: usa a preferência salva ou o idioma do navegador
      // Guard assíncrono: o redirect simples não aceita Promise
      beforeEnter: async () => {
        const salvo = await db.preferencias.get('idioma')
        const idioma = salvo?.valor && idiomaValido(salvo.valor)
          ? salvo.valor
          : detectarIdiomaNavegador()
        return `/${idioma}`
      },
    },
    {
      path: '/:idioma',
      component: () => import('../views/IdiomaLayout.vue'),
      children: rotasBase,
      beforeEnter: (to) => {
        // Idioma inválido na URL (ex.: /fr/jogo/mgs2) volta para a raiz,
        // que escolhe um idioma suportado
        if (!idiomaValido(to.params.idioma)) {
          return { name: 'raiz' }
        }
      },
    },
  ],
  // Com hash (ex.: link da timeline para uma seção), rola até a âncora; senão, topo
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
})

// Sincroniza o idioma do i18n e <html lang> com a URL
router.beforeEach(async (to) => {
  const idioma = to.params.idioma
  if (idiomaValido(idioma)) {
    i18n.global.locale.value = idioma
    document.documentElement.lang = idioma
    await db.preferencias.put({ chave: 'idioma', valor: idioma })
  }
})

export { LOCALES }
export default router
