const { chromium } = require('playwright');
// Teste ponta a ponta dos fluxos principais. Requer o app rodando com o seed aplicado:
//   npm run db:seed && npm run build && npm start -- -p 3100
//   node e2e/fluxos.js
const B = process.env.BASE_URL || 'http://localhost:3100';
const SP = process.argv[2] || require('node:os').tmpdir();
require('node:fs').mkdirSync(SP + '/shots', { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && erros.push('console: ' + m.text()));
  const ok = (c, msg) => { if (!c) { console.log('FALHOU:', msg); process.exitCode = 1; } else console.log('ok:', msg); };

  await page.goto(B + '/login');
  await page.fill('input[name=email]', 'admin@demo.org.br');
  await page.fill('input[name=senha]', 'errada');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForSelector('.alerta-erro');
  ok(true, 'senha errada mostra erro');
  await page.fill('input[name=senha]', 'sindicato123');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForURL('**/painel');
  await page.screenshot({ path: SP + '/shots/painel.png', fullPage: true });

  const rotas = ['/filiados', '/empresas', '/convencoes', '/financeiro', '/financeiro/gerar', '/financeiro/inadimplencia', '/financeiro/caixa', '/atendimentos', '/eventos', '/comunicados', '/configuracoes', '/conta', '/filiados/novo', '/empresas/novo', '/convencoes/novo', '/atendimentos/novo', '/eventos/novo'];
  for (const r of rotas) {
    const resp = await page.goto(B + r);
    ok(resp.status() === 200 && (await page.locator('h1').count()) > 0, `GET ${r} ${resp.status()}`);
  }
  await page.goto(B + '/financeiro'); await page.screenshot({ path: SP + '/shots/financeiro.png', fullPage: true });

  // Novo filiado: CPF inválido, depois válido
  await page.goto(B + '/filiados/novo');
  await page.fill('input[name=nome]', 'Teste da Silva E2E');
  await page.fill('input[name=cpf]', '123.456.789-00');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForSelector('.alerta-erro');
  ok((await page.textContent('.alerta-erro')).includes('CPF inválido'), 'CPF inválido rejeitado');
  await page.fill('input[name=cpf]', '529.982.247-25');
  await page.fill('input[name=mensalidade]', '42,50');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForURL(/\/filiados\/c/);
  const urlFiliado = page.url();
  ok((await page.textContent('h1')).includes('Teste da Silva E2E'), 'filiado criado, matrícula: ' + (await page.textContent('.subtitulo')).slice(0, 20));
  // dependente
  await page.click('summary:has-text("Adicionar dependente")');
  await page.fill('.expansivel input[name=nome]', 'Filho Teste');
  await page.fill('.expansivel input[name=parentesco]', 'Filho');
  await page.click('.expansivel button[type=submit]');
  await page.waitForSelector('td:has-text("Filho Teste")');
  ok(true, 'dependente adicionado');
  await page.screenshot({ path: SP + '/shots/filiado.png', fullPage: true });
  await page.goto(urlFiliado + '/carteirinha');
  await page.screenshot({ path: SP + '/shots/carteirinha.png' });

  // Gerar mensalidades da competência atual: novo filiado deve receber, demais já têm
  await page.goto(B + '/financeiro/gerar');
  await page.click('form:has(input[name=diaVencimento]) button[type=submit]');
  await page.waitForSelector('.alerta-ok');
  const msg = await page.textContent('.alerta-ok');
  ok(msg.startsWith('1 mensalidade'), 'geração idempotente: ' + msg);
  await page.click('form:has(input[name=diaVencimento]) button[type=submit]');
  await page.waitForFunction(() => document.querySelector('.alerta-ok')?.textContent.startsWith('0 '));
  ok(true, 'segunda geração não duplica');

  // Receber pagamento da cobrança do novo filiado
  const fid = urlFiliado.split('/').pop();
  await page.goto(B + '/financeiro?filiado=' + fid);
  await page.click('summary:has-text("Receber")');
  await page.click('.popover-corpo button[type=submit]');
  await page.waitForSelector('.etiqueta:has-text("Paga")');
  ok(true, 'pagamento registrado');
  await page.goto(B + '/financeiro/caixa');
  ok((await page.locator('td:has-text("Teste da Silva E2E")').count()) === 1, 'receita lançada no caixa');
  // Estornar
  await page.goto(B + '/financeiro?filiado=' + fid);
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Estornar")');
  await page.waitForSelector('summary:has-text("Receber")');
  await page.goto(B + '/financeiro/caixa');
  ok((await page.locator('td:has-text("Teste da Silva E2E")').count()) === 0, 'estorno remove receita do caixa');
  // Despesa manual
  await page.fill('input[name=descricao]', 'Material gráfico E2E');
  await page.fill('form:has(input[name=descricao]) input[name=valor]', '150,00');
  await page.selectOption('select[name=categoria]', 'Comunicação');
  await page.click('form:has(input[name=descricao]) button[type=submit]');
  await page.waitForSelector('td:has-text("Material gráfico E2E")');
  ok(true, 'despesa lançada');
  await page.screenshot({ path: SP + '/shots/caixa.png', fullPage: true });

  // Atendimento
  await page.goto(B + '/atendimentos/novo?filiado=' + fid);
  await page.selectOption('select[name=tipo]', 'JURIDICO');
  await page.fill('input[name=assunto]', 'Adicional noturno E2E');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForURL(/\/atendimentos\/c/);
  ok((await page.textContent('h1')).startsWith('#9'), 'protocolo sequencial: ' + (await page.textContent('h1')));
  await page.selectOption('select[name=status]', 'EM_ANDAMENTO');
  await page.fill('textarea[name=texto]', 'Notificação enviada à empresa.');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForSelector('.linha-tempo li');
  ok((await page.textContent('.linha-tempo')).includes('Aberto → Em andamento'), 'andamento com mudança de status');
  await page.screenshot({ path: SP + '/shots/atendimento.png', fullPage: true });

  // Evento + presença
  await page.goto(B + '/eventos/novo');
  await page.selectOption('select[name=tipo]', 'ASSEMBLEIA');
  await page.fill('input[name=titulo]', 'Assembleia E2E');
  await page.fill('input[name=inicio]', '2026-12-05T19:00');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForURL(/\/eventos\/c/);
  ok((await page.textContent('.subtitulo')).includes('05/12/2026, 19:00'), 'horário em Brasília preservado: ' + (await page.textContent('.subtitulo')));
  await page.fill('input[name=identificacao]', '52998224725');
  await page.click('form:has(input[name=identificacao]) button[type=submit]');
  await page.waitForSelector('td:has-text("Teste da Silva E2E")');
  ok(true, 'presença por CPF');
  await page.fill('input[name=identificacao]', '1');
  await page.click('form:has(input[name=identificacao]) button[type=submit]');
  await page.waitForFunction(() => document.querySelectorAll('.linha-tempo, table tbody tr').length >= 2);
  ok(true, 'presença por matrícula');

  // Convenção ACT sem empresa → erro
  await page.goto(B + '/convencoes/novo');
  await page.selectOption('select[name=tipo]', 'ACT');
  await page.fill('input[name=titulo]', 'ACT E2E');
  await page.fill('input[name=vigenciaInicio]', '2026-01-01');
  await page.fill('input[name=vigenciaFim]', '2026-12-31');
  await page.click('button[type=submit]:not(.btn-link)');
  await page.waitForSelector('.alerta-erro');
  ok((await page.textContent('.alerta-erro')).includes('empresa'), 'ACT exige empresa');

  // Instalação bloqueada depois que o sindicato existe
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(B + '/instalacao');
  ok(p2.url().endsWith('/login'), 'instalação bloqueada quando o sistema já está instalado');

  // Operador não acessa configurações
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(B + '/login');
  await p3.fill('input[name=email]', 'juridico@demo.org.br');
  await p3.fill('input[name=senha]', 'sindicato123');
  await p3.click('button[type=submit]:not(.btn-link)');
  await p3.waitForURL('**/painel');
  await p3.goto(B + '/configuracoes');
  ok(p3.url().includes('erro=acesso'), 'operador barrado em configurações');

  // Mobile
  const pm = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pm.context().addCookies(await page.context().cookies());
  await pm.goto(B + '/painel');
  const larg = await pm.evaluate(() => document.documentElement.scrollWidth);
  ok(larg <= 390, 'sem rolagem horizontal no celular: ' + larg);
  await pm.screenshot({ path: SP + '/shots/mobile.png', fullPage: false });

  console.log(erros.length ? 'ERROS NO NAVEGADOR:\n' + erros.join('\n') : 'sem erros no console');
  await browser.close();
})();
