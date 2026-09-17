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
    console.log("  ETAPA 2: ABRINDO CODMUNITY E ATIVANDO FILTROS DE JOGOS  ");
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

    console.log("🎮 Buscando os botões reais de BO6, MW3 e MW2 na interface...");
    const acionamentos = await page.evaluate(async () => {
        let logs = [];
        
        // Rolar um pouco a tela para garantir que a área de filtros não está oculta no topo
        window.scrollBy(0, 500);
        await new Promise(r => setTimeout(r, 1000));

        const alvos = [
            { id: 'BO6', termos: ['BO6'] },
            { id: 'MW3', termos: ['MW3', 'MWIII'] },
            { id: 'MW2', termos: ['MW2', 'MWII'] }
        ];

        // Seleciona TUDO no DOM para fazer um raio-x dos textos
        const todos = Array.from(document.querySelectorAll('*'));

        for (const alvo of alvos) {
            const possiveis = todos.filter(el => {
                // Filtramos elementos folha (sem muitos filhos) para não pegar divs gigantes
                if (el.children.length > 2) return false; 
                
                const txt = (el.textContent || '').trim().toUpperCase();
                if (!alvo.termos.includes(txt)) return false;

                const rect = el.getBoundingClientRect();
                // O botão precisa estar visível na tela e não ser o link do cabeçalho
                return rect.height > 0 && rect.top > 60;
            });

            if (possiveis.length > 0) {
                const btn = possiveis[0];
                // Sobe a hierarquia para achar o contêiner interativo (button, label, etc)
                const clicavel = btn.closest('button, [role="button"], [role="checkbox"], [role="tab"], label, div[class*="cursor"]') || btn;
                clicavel.click();
                logs.push(`✓ Filtro ativado na tela: ${alvo.id}`);
                await new Promise(r => setTimeout(r, 2000)); // Tempo pro React inserir o jogo na tabela
            } else {
                logs.push(`⚠️ Filtro não encontrado na tela: ${alvo.id}`);
            }
        }
        return logs;
    });

    acionamentos.forEach(log => console.log(`   └─ ${log}`));
    await new Promise(r => setTimeout(r, 3000));

    console.log("⏳ Rolando até a Meta Comparison Table...");
    for (let passo = 0; passo < 8; passo++) {
        await page.evaluate(() => window.scrollBy(0, 600));
        await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 2000));

    console.log("📋 Varrendo a tabela consolidada (50 passos acumulativos)...");
    const mapaGeral = {};

    for (let passo = 0; passo < 50; passo++) {
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

        // Mescla as armas encontradas na tela com o mapa global
        for (const [arma, tier] of Object.entries(armasNaTela)) {
            if (!mapaGeral[arma]) {
                mapaGeral[arma] = tier;
            }
        }

        // Desce aos poucos para carregar a próxima página invisível da tabela
        await page.evaluate(() => window.scrollBy(0, 450));
        await new Promise(r => setTimeout(r, 200));
    }

    await browser.close();

    console.log(`\n✓ Total de armas consolidadas de todos os jogos: ${Object.keys(mapaGeral).length}`);

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