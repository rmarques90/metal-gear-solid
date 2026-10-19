[English](README.md) · **Português**

# Guia Metal Gear Solid

Site interativo que reúne a história dos quatro primeiros jogos da série **Metal Gear Solid**, organizada por seção, com favoritos salvos no navegador e uma linha do tempo dos principais acontecimentos do enredo.

Jogos cobertos:

- Metal Gear Solid (1998)
- Metal Gear Solid 2: Sons of Liberty (2001)
- Metal Gear Solid 3: Snake Eater (2004)
- Metal Gear Solid 4: Guns of the Patriots (2008)

> Projeto de fãs, sem vínculo com a Konami ou com Hideo Kojima.

## Funcionalidades

- **Leitura por seção:** cada jogo tem sumário com botões, seções e subseções recolhíveis, e um botão **Resumo** que abre um resumo curto da seção em um popup.
- **Favoritos:** marque seções com a estrela. Os favoritos ficam salvos no IndexedDB do navegador e aparecem agrupados por jogo na página **Favoritos**.
- **Linha do tempo:** gráfico SVG com os 21 eventos de enredo, na ordem da história. Tem reprodução automática (play/pausa), navegação manual, teclado (setas e espaço) e uma barra de progresso que acompanha a reprodução.
- **Ligação entre timeline e texto:** cada evento tem o link **Ver na seção**, que leva ao parágrafo correspondente no guia e o destaca.
- **Dois idiomas:** português (Brasil) e inglês. O idioma aparece na URL (`/pt-BR/...` e `/en/...`) e é lembrado entre visitas. Se o navegador estiver em português, o site abre em pt-BR.
- **Créditos e atribuição:** página **Sobre** com a licença do conteúdo e página **Créditos** com a fonte de cada texto, capa e imagem.

## Stack

- [Vue 3](https://vuejs.org/) com `<script setup>` e [Vite](https://vite.dev/)
- [Vue Router](https://router.vuejs.org/) para as rotas com prefixo de idioma
- [Pinia](https://pinia.vuejs.org/) para o estado dos favoritos
- [vue-i18n](https://vue-i18n.intlify.dev/) para os textos da interface
- [Dexie](https://dexie.org/) sobre IndexedDB para favoritos e preferências
- [Vitest](https://vitest.dev/) para testes unitários
- [Playwright](https://playwright.dev/) para testes ponta a ponta
- [cheerio](https://cheerio.js.org/) e a API da Wikipédia para gerar os dados

## Pré-requisitos

- Node.js 20 ou superior
- npm

## Instalação e uso

```bash
npm install            # instala as dependências
npm run dev            # servidor de desenvolvimento (http://localhost:5173)
npm run build          # build de produção em dist/
npm run preview        # serve o build localmente
```

Testes:

```bash
npm test               # testes unitários (Vitest)
npm run test:e2e       # testes ponta a ponta (Playwright, sobe o build automaticamente)
```

Na primeira vez que for rodar os testes e2e, instale o navegador do Playwright:

```bash
npx playwright install chromium
```

## Dados

O conteúdo dos jogos é gerado a partir da Wikipédia em inglês e fica versionado em `src/data/`. Não é preciso rodar o pipeline para usar o site; os scripts servem para regenerar ou atualizar os dados.

Ordem sugerida:

| Comando | O que faz |
| --- | --- |
| `npm run dados:wiki` | Baixa os quatro artigos e gera `src/data/en/mgs1..4.json` (seções com IDs estáveis) |
| `npm run dados:capas` | Baixa as capas dos jogos para `src/assets/capas/` e gera `src/data/capas.json` com o crédito |
| `npm run dados:imagens` | Baixa as imagens dos eventos da timeline para `src/assets/timeline/` e atualiza o crédito em `timeline.json` |
| `npm run dados:paragrafos` | Liga cada evento da timeline ao parágrafo mais relevante da seção (campo `paragrafo`) |

Pontos importantes:

- `src/data/en/` é a fonte. `src/data/pt-BR/` contém as traduções, e cada arquivo ainda está marcado com `"revisado": false`.
- Os IDs das seções vêm do título em inglês (ex.: `mgs2/synopsis/plot`) e não mudam com a tradução. Por isso um favorito funciona nos dois idiomas.
- A tradução mantém o mesmo número de seções e parágrafos do original. O campo `paragrafo` da timeline vale para os dois idiomas por causa disso.
- Os termos fixos da tradução (nomes de personagens, títulos e termos de marca) ficam em `scripts/glossario.json`.
- A timeline (`src/data/en/timeline.json` e `src/data/pt-BR/timeline.json`) é curada à mão. Campos principais:
  - `anoHistoria`: ano na narrativa, usado para ordenar a timeline;
  - `ordemHistoria`: sequência dentro do mesmo ano;
  - `anoLancamento`: ano de lançamento do jogo;
  - `secaoId`: seção vinculada ao evento.
- Os scripts usam a API pública da Wikipédia, que limita requisições. Os scripts já tentam de novo quando recebem HTTP 429.

## Estrutura do projeto

```
src/
  components/   componentes reutilizáveis (seletor de idioma, popup de resumo, bandeiras)
  data/         dados dos jogos por idioma, loaders e funções de resumo/preview
  db/           banco local (Dexie): favoritos e preferências
  i18n/         configuração do vue-i18n e textos da interface (pt-BR e en)
  router/       rotas com prefixo de idioma
  stores/       store Pinia dos favoritos
  views/        páginas: início, jogo, favoritos, timeline, sobre, créditos e 404
  assets/       capas e imagens da timeline
  __tests__/    testes unitários
e2e/            testes ponta a ponta
scripts/        pipeline de coleta de dados e glossário de tradução
public/         arquivos estáticos (favicon)
```

## Licença e créditos

**Conteúdo textual:** os textos dos jogos são adaptados de artigos da [Wikipédia em inglês](https://en.wikipedia.org/), publicados sob a [licença CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). As traduções para português são derivadas desses textos e seguem a mesma licença.

**Imagens:** capas, screenshots e ícones pertencem aos respectivos detentores de direitos (Konami, Kojima Productions e autores das fotos). Elas são exibidas com crédito à fonte original. A página **Créditos** do site lista cada arquivo e sua origem.

**Código:** a licença do código ainda não foi definida.

Metal Gear e os personagens citados são marcas e propriedades de Konami e Kojima Productions. Este é um projeto de fãs, sem afiliação com essas empresas.
