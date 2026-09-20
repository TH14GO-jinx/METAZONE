async function sincronizarComMetaTable() {
  resetarJsonsParaTierE();

  console.log("\n==========================================================\n  ETAPA 2: ABRINDO CODMUNITY E EXPANDINDO TABELA COMPLETA \n==========================================================\n");

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 600000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
  await page.setDefaultTimeout(600000);

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const tipo = req.resourceType();
    if (tipo === 'image' || tipo === 'media' || tipo === 'font') {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log("🔗 Conectando a " + URL_CODMUNITY + "...");

  // Tentativa de connection com retry para site instável
  let tentativas = 0;
  const maxTentativas = 3;
  let conectado = false;

  while (tentativas < maxTentativas && !conectado) {
    try {
      console.log(`   Tentativa ${tentativas + 1}/${maxTentativas}...`);
      await page.goto(URL_CODMUNITY, { waitUntil: 'networkidle2', timeout: 120000 });
      conectado = true;
      console.log("   ✓ Conexão estabelecida");
    } catch (error) {
      tentativas++;
      if (tentativas >= maxTentativas) {
        console.log("   ⚠️ Todas as tentativas falharam. Continuando com conteúdo parcial...");
      } else {
        console.log(`   ⚠️ Tentativa ${tentativas} falhou. Aguardando antes de retry...`);
        await new Promise(r => setTimeout(r, 5000)); // 5 segundos entre tentativas
      }
    }
  }

  await new Promise(r => setTimeout(r, 8000));

  console.log("🎮 Ativando filtros de BO6, MW3 e MW2 na interface...");
  const acionamentos = await page.evaluate(() => {
    let logs = [];
    window.scrollBy(0, 500);
    return new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
      const alvos = [
        { id: 'BO6', termos: ['BO6'] },
        { id: 'MW3', termos: ['MW3', 'MWIII'] },
        { id: 'MW2', termos: ['MW2', 'MWII'] }
      ];

      const todos = Array.from(document.querySelectorAll('*'));

      for (const alvo of alvos) {
        const possiveis = todos.filter(el => {
          // Buscar especificamente por elementos com o texto do jogo, mais robusto
          if (!el.textContent) return false;
          const txt = el.textContent.trim().toUpperCase();
          if (!alvo.termos.includes(txt)) return false;

          // Buscar apenas em elementos que podem ser botões/links de filtros (tipo comum)
          const tag = el.tagName.toLowerCase();
          if (!['button', 'span', 'div', 'a', 'li', 'label'].includes(tag)) return false;

          const rect = el.getBoundingClientRect();
          return rect.height > 0 && rect.top > 60;
        });

        if (possiveis.length > 0) {
          const btn = possiveis[0];
          const clicavel = btn.closest('button, [role="button"], [role="checkbox"], [role="tab"], label, div[class*="cursor"]') || btn;
          clicavel.click();
          logs.push(`✓ Filtro ativado: ${alvo.id}`);
          return new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          logs.push(`⚠️ Filtro não encontrado: ${alvo.id}`);
        }
      }
      return logs;
    });
  });

  acionamentos.forEach(log => console.log(`   └─ ${log}`));
  await new Promise(r => setTimeout(r, 2000));

  console.log("📜 Clicando repetidamente em 'Show More' para revelar o catálogo completo...");
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => {
      const elementos = Array.from(document.querySelectorAll('button, span, div, a'));
      const btnMore = elementos.find(el => {
        const txt = (el.innerText || '').trim().toUpperCase();
        return (txt === 'SHOW MORE' || txt === 'LOAD MORE' || txt === 'VER MAIS') && el.offsetParent !== null;
      });
      if (btnMore) {
        btnMore.click();
        window.scrollBy(0, 600);
      }
    });
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log("📋 Lendo as linhas da tabela estendida (varredura progressiva)...");
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise(r => setTimeout(r, 1000));

  const mapaGeral = {};
  const tierOrder = { "Tier S": 0, "Tier A": 1, "Tier B": 2, "Tier C": 3, "Tier D": 4, "Tier E": 5 };

  for (let passo = 0; passo < 65; passo++) {
    const armasNaTela = await page.evaluate(() => {
      const itens = {};
      const linhas = Array.from(document.querySelectorAll('tr, [role="row"], div[class*="table-row"], div[class*="row"]'));

      linhas.forEach(linha => {
        const linkArma = linha.querySelector('a[href*="/weapon/"], a[href*="/weapons/"]');
        if (!linkArma) return;

        const elNome = linkArma.querySelector('h2, h3, h4, span, p') || linkArma;
        const nome = (elNome.innerText || '').split('\n')[0].trim().toUpperCase();

        if (!nome || nome.length < 2 || nome.includes('TIER') || nome.includes('LOADOUT')) return;
        if (itens[nome]) return;

        const textoLinha = (linha.innerText || '').toUpperCase();
        let tierDetectado = null;

        if (textoLinha.includes('ABSOLUTE META') || textoLinha.includes('ABSOLUTE')) {
          tierDetectado = 'Tier S';
        } else if (textoLinha.includes('A TIER') || textoLinha.includes('TIER A') || (textoLinha.includes('META') && !textoLinha.includes('WARZONE META'))) {
          tierDetectado = 'Tier A';
        } else if (textoLinha.includes('B TIER') || textoLinha.includes('TIER B')) {
          tierDetectado = 'Tier B';
        } else if (textoLinha.includes('C TIER') || textoLinha.includes('TIER C')) {
          tierDetectado = 'Tier C';
        } else if (textoLinha.includes('D TIER') || textoLinha.includes('TIER D')) {
          tierDetectado = 'Tier D';
        }

        if (!tierDetectado) {
          const badges = Array.from(linha.querySelectorAll('span, div, td, p'));
          for (const b of badges) {
            const t = (b.innerText || '').trim().toUpperCase();
            if (t === 'S') { tierDetectado = 'Tier S'; break; }
            if (t === 'A') { tierDetectado = 'Tier A'; break; }
            if (t === 'B') { tierDetectado = 'Tier B'; break; }
            if (t === 'C') { tierDetectado = 'Tier C'; break; }
            if (t === 'D') { tierDetectado = 'Tier D'; break; }
          }
        }

        if (tierDetectado) {
          itens[nome] = tierDetectado;
        }
      });

      return itens;
    });

    for (const [arma, tier] of Object.entries(armasNaTela)) {
      if (!mapaGeral[arma] || tierOrder[tier] < tierOrder[mapaGeral[arma]]) {
        mapaGeral[arma] = tier;
      }
    }

    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise(r => setTimeout(r, 150));
  }

  await browser.close();

  console.log(`\\n✓ Total consolidado (todos os jogos expandidos): ${Object.keys(mapaGeral).length} armas`);

  console.log("\\n📡 Armas em Absolute Meta (Tier S):");
  let totalS = 0;
  for (const [arma, tier] of Object.entries(mapaGeral)) {
    if (tier === 'Tier S') {
      totalS++;
      console.log("   ★ " + arma);
    }
  }
  console.log("Total em Tier S: " + totalS);

  const dataHoje = new Date().toISOString().split('T')[0];

  ARQUIVOS_JSON.forEach(caminho => {
    if (!fs.existsSync(caminho)) return;

    let armas = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    let contadores = { "Tier S": 0, "Tier A": 0, "Tier B": 0, "Tier C": 0, "Tier D": 0, "Tier E": 0 };

    armas = armas.map(arma => {
      let tierAtribuido = "Tier E";

      for (const [nomeWeb, tier] of Object.entries(mapaGeral)) {
        if (coincideNome(arma.nome, nomeWeb)) {
          tierAtribuido = tier;
          break;
        }
      }

      contadores[tierAtribuido]++;

      return {
        ...arma,
        tier: tierAtribuido,
        ultima_atualizacao: dataHoje
      };
    });

    fs.writeFileSync(caminho, JSON.stringify(armas, null, 2), 'utf-8');

    console.log("\\nArquivo: " + caminho);
    console.log("   └─ S: " + contadores["Tier S"] + " | A: " + contadores["Tier A"] + " | B: " + contadores["Tier B"] + " | C: " + contadores["Tier C"] + " | D: " + contadores["Tier D"]);
    console.log("   └─ Tier E (restantes): " + contadores["Tier E"]);
  });

  console.log("\\n==========================================================\\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!\\n==========================================================\\n");
}

sincronizarComMetaTable();
