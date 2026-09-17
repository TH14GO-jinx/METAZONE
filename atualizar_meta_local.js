const fs = require('fs');
const puppeteer = require('puppeteer');

const URL_BASE = 'https://codmunity.gg/tier-list/warzone';

function normalizar(txt) {
    return (txt || '')
        .toUpperCase()
        .replace(/[-_.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function coletarDadosUnificados() {
    console.log("==========================================================");
    console.log("  SINCRONIZANDO WARZONE TIER LIST UNIFICADO (CODMUNITY)   ");
    console.log("==========================================================\n");

    const browser = await puppeteer.launch({
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
    ]
});
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

    console.log(`🔗 Conectando a ${URL_BASE}...`);
    await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));

    // Extrai o ranking padrão da página (onde estão as 3 Absolute Meta reais)
    console.log("🔍 Extraindo ranking geral da página inicial...");
    let mapaGeral = await extrairTabela(page);

    // Agora varre as abas reais que existem na CODMunity: All, MW3 e MW2
    const seletoresAbas = ['ALL', 'ALL GAMES', 'BO6', 'BLACK OPS 6', 'MW3', 'MW2'];
    for (const aba of seletoresAbas) {
        console.log(`🎮 Consultando aba/filtro: ${aba}...`);
        const clicou = await page.evaluate((nomeAba) => {
            const botoes = Array.from(document.querySelectorAll('button, [role="button"], span, a'));
            const btn = botoes.find(el => (el.innerText || '').trim().toUpperCase() === nomeAba);
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }, aba);

        if (clicou) {
            await new Promise(r => setTimeout(r, 3500));
            const dadosAba = await extrairTabela(page);
            
            // Adiciona armas novas mantendo a prioridade do ranking geral
            for (const [arma, tier] of Object.entries(dadosAba)) {
                if (!mapaGeral[arma]) {
                    // Armas vindas de abas legadas não podem entrar como Tier S
                    mapaGeral[arma] = (tier === 'Tier S') ? 'Tier A' : tier;
                }
            }
        }
    }

    await browser.close();

    // TRAVA DAS 3 ARMAS: Garante que apenas 3 armas no máximo fiquem no Tier S
    const armasTierS = Object.entries(mapaGeral).filter(([_, t]) => t === 'Tier S');
    if (armasTierS.length > 3) {
        console.log(`⚠️ Foram detectadas ${armasTierS.length} armas no Tier S. Mantendo estritamente as 3 primeiras do topo.`);
        armasTierS.slice(3).forEach(([arma]) => {
            mapaGeral[arma] = 'Tier A';
        });
    }

    console.log("\n📡 Armas confirmadas em Absolute Meta (Tier S):");
    for (const [arma, tier] of Object.entries(mapaGeral)) {
        if (tier === 'Tier S') console.log(`   ★ ${arma}`);
    }
    console.log(`\nTotal consolidado: ${Object.keys(mapaGeral).length} armas ranqueadas.\n`);

    return mapaGeral;
}

async function extrairTabela(page) {
    return await page.evaluate(() => {
        const mapa = {};
        const linhas = Array.from(document.querySelectorAll('table tr, tbody tr'));

        linhas.forEach(linha => {
            const celulas = Array.from(linha.querySelectorAll('td, th')).map(c => (c.innerText || '').trim());
            if (celulas.length >= 2) {
                let nome = celulas[0];
                if (!nome || nome.toUpperCase() === 'WEAPON' || nome.toUpperCase() === 'CATEGORY') {
                    nome = celulas[1] || '';
                }

                const linhaTexto = celulas.join(' ').toUpperCase();
                let tier = null;

                if (linhaTexto.includes('ABSOLUTE META')) tier = 'Tier S';
                else if (linhaTexto.includes('A TIER')) tier = 'Tier A';
                else if (linhaTexto.includes('B TIER')) tier = 'Tier B';
                else if (linhaTexto.includes('C TIER')) tier = 'Tier C';
                else if (linhaTexto.includes('D TIER')) tier = 'Tier D';

                if (tier && nome && nome.length >= 2) {
                    mapa[nome.toUpperCase()] = tier;
                }
            }
        });

        // Varredura de blocos visuais
        const blocos = Array.from(document.querySelectorAll('section, div[class*="tier"], div[class*="meta"]'));
        blocos.forEach(bloco => {
            const header = (bloco.querySelector('h1, h2, h3, h4')?.innerText || '').toUpperCase();
            let tierBloco = null;

            if (header.includes('ABSOLUTE META')) tierBloco = 'Tier S';
            else if (header.includes('A TIER') || header.includes('TIER A')) tierBloco = 'Tier A';
            else if (header.includes('B TIER') || header.includes('TIER B')) tierBloco = 'Tier B';
            else if (header.includes('C TIER') || header.includes('TIER C')) tierBloco = 'Tier C';
            else if (header.includes('D TIER') || header.includes('TIER D')) tierBloco = 'Tier D';

            if (tierBloco) {
                bloco.querySelectorAll('a[href*="/weapons/"], h3, h4').forEach(item => {
                    let nomeArma = (item.innerText || '').trim().toUpperCase();
                    if (nomeArma.length >= 2 && !nomeArma.includes('TIER') && !nomeArma.includes('META') && !mapa[nomeArma]) {
                        mapa[nomeArma] = tierBloco;
                    }
                });
            }
        });

        return mapa;
    });
}

function coincideNome(nomeArquivo, nomeWeb) {
    const a = normalizar(nomeArquivo);
    const b = normalizar(nomeWeb);

    if (!a || !b) return false;
    if (a === b) return true;

    const regB = new RegExp(`(^|\\s)${b.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(\\s|$)`, 'i');
    const regA = new RegExp(`(^|\\s)${a.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(\\s|$)`, 'i');

    return regB.test(a) || regA.test(b);
}

async function sincronizarTudo() {
    const mapaWeb = await coletarDadosUnificados();

    const arquivos = [
        './armas_bo7.json',
        './armas_bo6.json',
        './armas_mw3.json',
        './armas_mw2.json',
        './armas.json'
    ];

    const dataHoje = new Date().toISOString().split('T')[0];

    arquivos.forEach(caminho => {
        if (!fs.existsSync(caminho)) return;

        let armas = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
        let contadores = { "Tier S": 0, "Tier A": 0, "Tier B": 0, "Tier C": 0, "Tier D": 0, "Tier E": 0 };

        // 1. Zera todas para Tier E
        armas = armas.map(arma => ({
            ...arma,
            tier: "Tier E",
            ultima_atualizacao: dataHoje
        }));

        // 2. Aplica as classificações extraídas
        armas = armas.map(arma => {
            let tierAtribuido = "Tier E";

            for (const [nomeWeb, tier] of Object.entries(mapaWeb)) {
                if (coincideNome(arma.nome, nomeWeb)) {
                    tierAtribuido = tier;
                    break;
                }
            }

            contadores[tierAtribuido]++;

            return {
                ...arma,
                tier: tierAtribuido
            };
        });

        fs.writeFileSync(caminho, JSON.stringify(armas, null, 2), 'utf-8');

        console.log(`📄 Arquivo: ${caminho}`);
        console.log(`   └─ S: ${contadores["Tier S"]} | A: ${contadores["Tier A"]} | B: ${contadores["Tier B"]} | C: ${contadores["Tier C"]} | D: ${contadores["Tier D"]}`);
        console.log(`   └─ Tier E (restantes): ${contadores["Tier E"]}\n`);
    });

    console.log("==========================================================");
    console.log("🎉 ATUALIZAÇÃO CONCLUÍDA COM RIGOR DE 3 TIERS S!");
    console.log("==========================================================");
}

sincronizarTudo();