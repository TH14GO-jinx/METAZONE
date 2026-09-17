const fs = require('fs');
const puppeteer = require('puppeteer');

const URL_CODMUNITY = 'https://codmunity.gg/tier-list/warzone';

const ARQUIVOS_JSON = [
    './armas_bo7.json',
    './armas_bo6.json',
    './armas_mw3.json',
    './armas_mw2.json',
    './armas.json'
];

const ALIASES = {
    "VOYAK KT 3": ["VOYAK KT-3", "VOYAK", "KT-3"],
    "STRIDER 300": ["STRIDER-300", "STRIDER"],
    "MK35 ISR": ["MK35-ISR", "MK35"],
    "RYDEN 45K": ["RYDEN-45K", "RYDEN"],
    "TR51 PARA": ["TR-51 PARA", "TR51", "TR-51"],
    "VMP": ["VMP", "VMP 9MM"],
    "JACKAL PDW": ["JACKAL"],
    "SUPERI 46": ["SUPERI"],
    "STATIC HV": ["STATIC-HV", "STATIC"],
    "FJX HORUS": ["HORUS"]
};

function normalizar(txt) {
    return (txt || '')
        .toUpperCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[-_.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function coincideNome(nomeArquivo, nomeWeb) {
    const a = normalizar(nomeArquivo);
    const b = normalizar(nomeWeb);

    if (!a || !b) return false;
    if (a === b) return true;

    const limpoA = a.replace(/[^A-Z0-9]/g, '');
    const limpoB = b.replace(/[^A-Z0-9]/g, '');
    if (limpoA === limpoB) return true;
    if (limpoA.includes(limpoB) || limpoB.includes(limpoA)) return true;

    for (const [padrao, sinonimos] of Object.entries(ALIASES)) {
        const padraoLimpo = normalizar(padrao).replace(/[^A-Z0-9]/g, '');
        const sinonimosLimpos = sinonimos.map(s => normalizar(s).replace(/[^A-Z0-9]/g, ''));

        const matchB = (limpoB === padraoLimpo || sinonimosLimpos.includes(limpoB));
        const matchA = (limpoA === padraoLimpo || sinonimosLimpos.includes(limpoA));

        if (matchA && matchB) return true;
    }

    return false;
}

function resetarJsonsParaTierE() {
    console.log("==========================================================");
    console.log("  ETAPA 1: RESETANDO ARQUIVOS JSON PARA TIER E            ");
    console.log("==========================================================\n");

    const dataHoje = new Date().toISOString().split('T')[0];

    ARQUIVOS_JSON.forEach(caminho => {
        if (!fs.existsSync(caminho)) return;

        let armas = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
        armas = armas.map(arma => ({
            ...arma,
            tier: "Tier E",
            ultima_atualizacao: dataHoje
        }));

        fs.writeFileSync(caminho, JSON.stringify(armas, null, 2), 'utf-8');
        console.log(`✓ ${caminho} resetado (${armas.length} armas em Tier E)`);
    });
}

async function sincronizarComMetaTable() {
    resetarJsonsParaTierE();

    console.log("\n==========================================================");
    console.log("  ETAPA 2: ABRINDO CODMUNITY E EXPANDINDO COMPARISON TABLE");
    console.log("==========================================================\n");

    const browser = await puppeteer.launch({
        headless: 'new',
        protocolTimeout: 240000,
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

    console.log("🔗 Conectando a " + URL_CODMUNITY + "...");
    await page.goto(URL_CODMUNITY, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    console.log("⏳ Rolando até a seção da Meta Comparison Table...");
    for (let passo = 0; passo < 10; passo++) {
        await page.evaluate(() => window.scrollBy(0, 700));
        await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 2000));

    console.log("🎮 Ativando botões de filtro para BO6, MWIII e MWII...");
    await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll('button, [role="tab"], [role="button"], span, div'));
        
        // Clica nos seletores de jogos da própria área da Comparison Table
        const alvos = ['BO6', 'MW3', 'MWIII', 'MW2', 'MWII', 'ALL'];
        botoes.forEach(b => {
            const txt = (b.innerText || '').trim().toUpperCase();
            if (alvos.some(a => txt === a || txt === `+ ${a}`) && b.offsetParent !== null) {
                b.click();
            }
        });
    });

    await new Promise(r => setTimeout(r, 3000));

    // Se houver botão "Show More" / "Load More" na tabela, clica nele repetidamente
    console.log("📜 Expandindo todas as páginas/linhas da tabela comparativa...");
    await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) {
            const botoesMais = Array.from(document.querySelectorAll('button, a, span'));
            const btnMais = botoesMais.find(b => {
                const t = (b.innerText || '').trim().toUpperCase();
                return (t.includes('SHOW MORE') || t.includes('LOAD MORE') || t.includes('VER MAIS')) && b.offsetParent !== null;
            });

            if (btnMais) {
                btnMais.click();
                await new Promise(res => setTimeout(res, 1500));
            } else {
                break;
            }
        }
    });

    // Scroll adicional leve para garantir que as novas linhas injetadas sejam montadas no DOM
    for (let passo = 0; passo < 6; passo++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 2000));

    console.log("📋 Extraindo dados consolidados de todas as linhas...");
    const mapaGeral = await page.evaluate(() => {
        const resultado = {};
        const linhas = Array.from(document.querySelectorAll('tr, [role="row"], div[class*="table-row"], div[class*="row"]'));

        linhas.forEach(linha => {
            const linkArma = linha.querySelector('a[href*="/weapon/"], a[href*="/weapons/"]');
            if (!linkArma) return;

            const elNome = linkArma.querySelector('h2, h3, h4, span, p') || linkArma;
            const nome = (elNome.innerText || '').split('\n')[0].trim().toUpperCase();

            if (!nome || nome.length < 2 || nome.includes('TIER') || nome.includes('META') || nome.includes('LOADOUT')) return;
            if (resultado[nome]) return;

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
                resultado[nome] = tierDetectado;
            }
        });

        return resultado;
    });

    await browser.close();

    console.log(`\n✓ Total de armas identificadas na Comparison Table: ${Object.keys(mapaGeral).length}`);

    console.log("\n📡 Armas em Absolute Meta (Tier S):");
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

        console.log("\nArquivo: " + caminho);
        console.log("   └─ S: " + contadores["Tier S"] + " | A: " + contadores["Tier A"] + " | B: " + contadores["Tier B"] + " | C: " + contadores["Tier C"] + " | D: " + contadores["Tier D"]);
        console.log("   └─ Tier E (restantes): " + contadores["Tier E"]);
    });

    console.log("\n==========================================================");
    console.log("🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("==========================================================");
}

sincronizarComMetaTable();