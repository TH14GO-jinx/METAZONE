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

async function rasparTabelaVisivel(page) {
    return await page.evaluate(() => {
        const resultado = {};
        const linhas = Array.from(document.querySelectorAll('tr, [role="row"], div[class*="table-row"], div[class*="row"]'));

        linhas.forEach(linha => {
            const linkArma = linha.querySelector('a[href*="/weapon/"], a[href*="/weapons/"]');
            if (!linkArma) return;

            const elNome = linkArma.querySelector('h2, h3, h4, span, p') || linkArma;
            const nome = (elNome.innerText || '').split('\n')[0].trim().toUpperCase();

            if (!nome || nome.length < 2 || nome.includes('TIER') || nome.includes('LOADOUT')) return;
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
}

async function sincronizarComMetaTable() {
    resetarJsonsParaTierE();

    console.log("\n==========================================================");
    console.log("  ETAPA 2: LENDO COMPARISON TABLE OFICIAL DO WARZONE      ");
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

    // 1. Rola suavemente até a Comparison Table sem alterar filtros (visão pura oficial)
    console.log("⏳ Rolando até a Meta Comparison Table na visão oficial...");
    for (let passo = 0; passo < 8; passo++) {
        await page.evaluate(() => window.scrollBy(0, 750));
        await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 2000));

    // 2. Extrai o Meta Geral Primário (onde o Tier S real está intacto)
    console.log("📋 Extraindo dados primários oficiais...");
    const mapaOficial = await rasparTabelaVisivel(page);
    console.log(`   ✓ ${Object.keys(mapaOficial).length} armas oficiais mapeadas.`);

    // 3. Para catalogar armas restantes de outros jogos (BO6, MW3, MW2),
    // alternamos individualmente, MAS impedimos que qualquer arma sobrescreva ou ganhe Tier S indevido
    const mapaGeral = { ...mapaOficial };

    const abasSecundarias = ['BO6', 'MW3', 'MW2'];
    for (const aba of abasSecundarias) {
        const clicou = await page.evaluate((nomeAba) => {
            const botoes = Array.from(document.querySelectorAll('button, [role="tab"], [role="button"], span, div'));
            const btn = botoes.find(el => {
                const t = (el.innerText || '').trim().toUpperCase();
                const ehVisivel = el.offsetParent !== null;
                if (!ehVisivel) return false;
                if (nomeAba === 'MW3') return t === 'MW3' || t === 'MWIII';
                if (nomeAba === 'MW2') return t === 'MW2' || t === 'MWII';
                return t === nomeAba;
            });

            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }, aba);

        if (clicou) {
            console.log(`🎮 Coletando dados complementares de ${aba}...`);
            await new Promise(r => setTimeout(r, 2500));

            // Rola levemente para garantir montagem
            await page.evaluate(() => window.scrollBy(0, 300));
            await new Promise(r => setTimeout(r, 1000));

            const dadosAba = await rasparTabelaVisivel(page);

            for (const [arma, tier] of Object.entries(dadosAba)) {
                // REGRA CRÍTICA: Se a arma já foi definida no Meta Geral primário, NÃO SOBRESCREVE.
                if (!mapaGeral[arma]) {
                    // Armas legadas vindas de abas secundárias nunca podem ser Tier S no Warzone atual:
                    // se a aba isolada deu Tier S para uma arma de MW3/MW2, ela é ajustada para Tier B/C conforme o meta global.
                    let tierAjustado = tier;
                    if (tierAjustado === 'Tier S') {
                        tierAjustado = 'Tier B';
                    }
                    mapaGeral[arma] = tierAjustado;
                }
            }
        }
    }

    await browser.close();

    console.log(`\n✓ Total de armas consolidadas: ${Object.keys(mapaGeral).length}`);

    console.log("\n📡 Armas em Absolute Meta (Tier S):");
    let totalS = 0;
    for (const [arma, tier] of Object.entries(mapaGeral)) {
        if (tier === 'Tier S') {
            totalS++;
            console.log("   ★ " + arma);
        }
    }
    console.log("Total em Tier S: " + totalS);

    // Gravação final nos arquivos JSON
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