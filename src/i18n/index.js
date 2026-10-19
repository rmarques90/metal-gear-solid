import { createI18n } from 'vue-i18n'
import ptBR from './locales/pt-BR.json'
import en from './locales/en.json'

export const LOCALES = ['pt-BR', 'en']
export const LOCALE_PADRAO = 'pt-BR'

// Idioma do navegador: português → pt-BR, qualquer outro → en
export function detectarIdiomaNavegador() {
  const idioma = (navigator.language || '').toLowerCase()
  return idioma.startsWith('pt') ? 'pt-BR' : 'en'
}

export function idiomaValido(valor) {
  return LOCALES.includes(valor)
}

const i18n = createI18n({
  legacy: false,
  locale: LOCALE_PADRAO,
  fallbackLocale: 'en',
  messages: {
    'pt-BR': ptBR,
    en,
  },
})

export default i18n
