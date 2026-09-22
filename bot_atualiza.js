const puppeteer = require('puppeteer');
const fs = require('fs');

const arquivosJson = ['armas_bo6.json', 'armas_bo7.json', 'armas_mw2.json', 'armas_mw3.json'];
const dataDeHoje = () => new Date().toISOString().split('T')[0];
const normalizarNome = (nome) => nome.toUpperCase().replace(/[-\s_.]/g, '');

(async () => {
    const url = 'https://wzhub.gg/pt/loadouts';

    console.log(`[1/4] 🧹 Limpando o status dos arquivos locais...`);
    let jsonDados = {};

    for (let arquivo of arquivosJson) {
        if (fs.existsSync(arquivo)) {
            let armas = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
            armas.forEach(arma => arma.status = "");
            jsonDados[arquivo] = armas;
        } else {
            console.log(`⚠️ Arquivo não encontrado: ${arquivo}`);
        }
    }

    console.log(`[2/4] ⏳ Acessando WZHUB e extraindo loadouts...`);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 300;
            let timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    const armasExtraidas = await page.evaluate(() => {
        const extraidas = [];
        
        // Mapeia os textos do site para os valores exatos que irão para o JSON
        const mapaStatus = {
            "META ABSOLUTA": "Absolute Meta",
            "META ABSOLUTO": "Absolute Meta",
            "ABSOLUTE META": "Absolute Meta",
            "NOVO": "Novo",
            "NEW": "Novo",
            "META": "Meta"
        };
        
        const categoriasValidas = Object.keys(mapaStatus);
        const tiposValidos = ["AR", "SMG", "LMG", "SNIPER", "PISTOL", "SHOTGUN", "B.RIFLES", "RIFLE", "SPECIAL", "MELEE"];
        
        const textoCompleto = document.body.innerText;
        const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l !== '');
        
        for (let i = 0; i < linhas.length; i++) {
            if (linhas[i].toUpperCase().includes('AUTOR: WZHUB')) {
                let categoriaEncontrada = null;
                let tipoEncontrado = null;
                let nomeEncontrado = null;

                for (let step = 1; step <= 4; step++) {
                    let linhaCat = linhas[i - step] ? linhas[i - step].toUpperCase() : "";
                    if (i - step >= 0 && categoriasValidas.includes(linhaCat)) {
                        categoriaEncontrada = mapaStatus[linhaCat];
                        break;
                    }
                }

                if (categoriaEncontrada) {
                    let indexTipo = -1;
                    for (let step = 1; step <= 6; step++) {
                        let linhaTipo = linhas[i - step] ? linhas[i - step].toUpperCase().split('|')[0].trim() : "";
                        if (i - step >= 0 && tiposValidos.includes(linhaTipo)) {
                            tipoEncontrado = linhaTipo;
                            indexTipo = i - step;
                            break;
                        }
                    }

                    if (indexTipo > 0) {
                        let linhaAcimaDoTipo = linhas[indexTipo - 1].toUpperCase();

                        if (["BO6", "BO7", "MW2", "MW3"].includes(linhaAcimaDoTipo)) {
                            nomeEncontrado = linhas[indexTipo - 2];
                        } else {
                            nomeEncontrado = linhaAcimaDoTipo.replace(/BO6|BO7|MW3|MW2/gi, '').trim();
                            if (!nomeEncontrado) {
                                nomeEncontrado = linhas[indexTipo - 2];
                            }
                        }

                        if (nomeEncontrado && categoriaEncontrada) {
                            extraidas.push({
                                nome: nomeEncontrado,
                                status: categoriaEncontrada
                            });
                        }
                    }
                }
            }
        }
        return extraidas;
    });

    await browser.close();
    console.log(`✔ Raspagem concluída! ${armasExtraidas.length} armas válidas capturadas.`);

    console.log(`[3/4] 🔄 Cruzando dados e atualizando os status...`);

    let totalAtualizadas = 0;

    for (let arquivo of arquivosJson) {
        if (!jsonDados[arquivo]) continue;

        let armasJson = jsonDados[arquivo];
        let contador = 0;

        armasJson.forEach(armaLocal => {
            let nomeLocalNorm = normalizarNome(armaLocal.nome);

            let armaEncontradaNoSite = armasExtraidas.find(armaSite => {
                let nomeSiteNorm = normalizarNome(armaSite.nome);
                if (nomeSiteNorm === nomeLocalNorm) return true;
                if (nomeSiteNorm.length >= 3 && nomeLocalNorm.length >= 3) {
                    if (nomeLocalNorm.includes(nomeSiteNorm) || nomeSiteNorm.includes(nomeLocalNorm)) {
                        return true;
                    }
                }
                return false;
            });

            if (armaEncontradaNoSite) {
                armaLocal.status = armaEncontradaNoSite.status;
                armaLocal.ultima_atualizacao = dataDeHoje();
                contador++;
                totalAtualizadas++;
            }
        });

        console.log(`[4/4] 💾 Salvando ${arquivo} (${contador} armas com status atualizado)...`);
        fs.writeFileSync(arquivo, JSON.stringify(armasJson, null, 2), 'utf-8');
    }

    console.log(`\n✅ Concluído! Total de armas sincronizadas: ${totalAtualizadas}`);
})();