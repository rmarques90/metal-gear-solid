import { test, expect } from '@playwright/test'

test('a raiz redireciona para um idioma suportado', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(pt-BR|en)$/)
})

test('a home lista os quatro jogos', async ({ page }) => {
  await page.goto('/pt-BR')
  await expect(page.locator('.card')).toHaveCount(4)
})

test('favoritar uma seção persiste após recarregar e aparece em Favoritos', async ({ page }) => {
  await page.goto('/pt-BR/jogo/mgs2')

  const primeiroBotao = page.locator('button.favorito').first()
  await primeiroBotao.click()
  await expect(primeiroBotao).toHaveAttribute('aria-pressed', 'true')

  // Espera a gravação no IndexedDB terminar antes de recarregar
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((resolve) => {
            const pedido = indexedDB.open('mgsGuia')
            pedido.onsuccess = () => {
              const tx = pedido.result.transaction('favoritos').objectStore('favoritos').count()
              tx.onsuccess = () => resolve(tx.result)
            }
          }),
      ),
    )
    .toBe(1)

  await page.reload()
  await expect(page.locator('button.favorito').first()).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/pt-BR/favoritos')
  await expect(page.locator('.favoritos .secao')).toHaveCount(1)
})

test('trocar o idioma mantém a página atual', async ({ page }) => {
  await page.goto('/pt-BR/jogo/mgs3')
  await page.getByRole('button', { name: 'Idioma' }).click()
  await page.getByRole('option', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en\/jogo\/mgs3$/)
  await expect(page.locator('h1').first()).toHaveText('Metal Gear Solid 3: Snake Eater')
})

test('a timeline mostra os 21 eventos e avança ao clicar em próximo', async ({ page }) => {
  await page.goto('/pt-BR/timeline')
  await expect(page.locator('.no')).toHaveCount(21)

  const titulo = page.locator('.detalhe h2')
  const antes = await titulo.textContent()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(titulo).not.toHaveText(antes)
})

test('a timeline mostra a cronologia da história, sem seletor de ordem', async ({ page }) => {
  await page.goto('/pt-BR/timeline')
  await expect(page.locator('.ordem select')).toHaveCount(0)
  await expect(page.locator('.no')).toHaveCount(21)
})

test('página inexistente mostra o 404', async ({ page }) => {
  await page.goto('/pt-BR/pagina-que-nao-existe')
  await expect(page.locator('h1')).toHaveText('Página não encontrada.')
})

test('a página de créditos lista as fontes da Wikipédia', async ({ page }) => {
  await page.goto('/pt-BR/creditos')
  await expect(page.locator('h1')).toHaveText('Créditos')
  await expect(page.locator('a[href*="wikipedia.org"]')).toHaveCount(4)
})

test('"Ver na seção" leva à seção e destaca o parágrafo do evento', async ({ page }) => {
  await page.goto('/pt-BR/timeline')
  await page.locator('.no[aria-label="Gray Fox revela-se como Deepthroat"]').dispatchEvent('click')
  await page.getByRole('link', { name: 'Ver na seção' }).click()

  await expect(page).toHaveURL(/\/pt-BR\/jogo\/mgs1\?paragrafo=5#mgs1--synopsis--plot$/)
  const destaque = page.locator('.paragrafo.destaque')
  await expect(destaque).toHaveCount(1)
  await expect(destaque).toContainText('Gray Fox')
})

test('a home mostra capa em cada card e o resumo do site', async ({ page }) => {
  await page.goto('/pt-BR')
  await expect(page.locator('.card img')).toHaveCount(4)
  await expect(page.locator('.resumo')).toContainText('guia interativo')
})

test('a página Sobre traz a atribuição da Wikipédia, que saiu do rodapé', async ({ page }) => {
  await page.goto('/pt-BR')
  await expect(page.locator('.rodape')).not.toContainText('Wikipédia')
  await page.getByRole('link', { name: 'Sobre' }).last().click()
  await expect(page).toHaveURL(/\/pt-BR\/sobre$/)
  await expect(page.locator('.sobre')).toContainText('CC BY-SA 4.0')
})

test('a barra de progresso avança ao reproduzir e para ao pausar', async ({ page }) => {
  await page.goto('/pt-BR/timeline')
  const barra = page.getByRole('progressbar')
  const inicio = Number(await barra.getAttribute('aria-valuenow'))

  await page.getByRole('button', { name: 'Reproduzir' }).click()
  await expect.poll(async () => Number(await barra.getAttribute('aria-valuenow'))).toBeGreaterThan(inicio)

  await page.getByRole('button', { name: 'Pausar' }).click()
  const pausada = Number(await barra.getAttribute('aria-valuenow'))
  await page.waitForTimeout(400)
  expect(Number(await barra.getAttribute('aria-valuenow'))).toBe(pausada)
})

test('os cards da home têm capas do mesmo tamanho e textos alinhados', async ({ page }) => {
  await page.goto('/pt-BR')
  // Espera os cards carregarem antes de medir
  await expect(page.locator('.capa')).toHaveCount(4)
  const capas = await page.locator('.capa').evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().height)),
  )
  expect(new Set(capas).size).toBe(1)

  const anos = await page.locator('.ano').evaluateAll((els) =>
    els.map((e) => Math.round(e.getBoundingClientRect().top)),
  )
  expect(new Set(anos).size).toBe(1)
})

test('recolher e expandir uma seção oculta e mostra o conteúdo', async ({ page }) => {
  await page.goto('/pt-BR/jogo/mgs2')
  const primeira = page.locator('.secao').first()
  const botao = primeira.locator('button.recolher')
  await expect(botao).toHaveAttribute('aria-expanded', 'true')
  await botao.click()
  await expect(botao).toHaveAttribute('aria-expanded', 'false')
  await expect(primeira.locator('.conteudo-secao')).toBeHidden()
  await botao.click()
  await expect(primeira.locator('.conteudo-secao')).toBeVisible()
})

test('o botão Resumo abre um popup com o resumo, fechado com Esc', async ({ page }) => {
  await page.goto('/pt-BR/jogo/mgs1')
  await page.locator('.secao').first().getByRole('button', { name: 'Resumo' }).click()
  const popup = page.getByRole('dialog')
  await expect(popup).toBeVisible()
  await expect(popup.locator('p')).not.toBeEmpty()
  await page.keyboard.press('Escape')
  await expect(popup).toHaveCount(0)
})
