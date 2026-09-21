// ========================================================
//  1. CONFIGURAÇÃO DE ASSETS & CDN DO GITHUB              |
// ========================================================
const USUARIO_GITHUB = "th14go-jinx";
const ASSETS_CDN = `https://cdn.jsdelivr.net/gh/${USUARIO_GITHUB}/warzone-assets@main/`;


// ========================================================
//  0. UTILITÁRIOS (SEGURANÇA, STORAGE, LOOKUP)            |
// ========================================================
// Escapa texto vindo do usuário/JSON antes de entrar em innerHTML
function escapeHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Gera um argumento JS seguro para usar dentro de onclick="fn(...)"
function jsArg(valor) {
    return escapeHTML(JSON.stringify(String(valor ?? "")));
}

// Lê JSON do localStorage sem quebrar a página se estiver corrompido
function lerJSON(chave, padrao) {
    try {
        const bruto = localStorage.getItem(chave);
        if (bruto === null) return padrao;
        const valor = JSON.parse(bruto);
        if (valor === null) return padrao;
        if (Array.isArray(padrao) && !Array.isArray(valor)) return padrao;
        return valor;
    } catch (e) {
        console.warn(`localStorage["${chave}"] inválido, usando padrão.`, e);
        return padrao;
    }
}

// Resolve o jogo a partir do texto "NOME (JOGO - CLASSE)" das builds da comunidade
function obterJogoPorNomeArma(textoArma) {
    const bruto = String(textoArma || "");
    const nome = bruto.split("(")[0].trim().toUpperCase();

    const achada = listaMetaArmas.find(a => (a.nome || "").toUpperCase() === nome);
    if (achada) return obterJogoDaArma(achada);

    const m = bruto.match(/\((MW2|MW3|BO6|BO7)\b/i);
    if (m) return m[1].toUpperCase();

    return obterJogoDaArma({ nome });
}

// A classe vem do campo "tipo" do JSON; as listas de nomes só servem de reserva
const CLASSE_POR_TIPO = {
    "espingardas": "Espingardas", "espingarda": "Espingardas", "shotgun": "Espingardas",
    "submetralhadoras": "SMT", "submetralhadora": "SMT", "smt": "SMT", "smg": "SMT",
    "fuzis de precisão": "Fuzis de Precisão", "fuzis de precisao": "Fuzis de Precisão", "sniper": "Fuzis de Precisão",
    "fuzis de atirador": "Fuzis de Atirador", "marksman": "Fuzis de Atirador",
    "lmg": "ML", "ml": "ML", "metralhadoras leves": "ML", "metralhadora leve": "ML",
    "fuzis de batalha": "Fuzis de Batalha", "battle rifle": "Fuzis de Batalha",
    "pistolas": "Pistolas", "pistola": "Pistolas", "handgun": "Pistolas",
    "fuzis de assalto": "Fuzis de Assalto",
    "lançadores / especiais / facas": "Especiais", "lançadores": "Especiais", "especiais": "Especiais"
};

// Armazenamento em memória dos dados dos arquivos JSON
let listaMetaArmas = [];
let acessoriosGlobais = {};

// Variáveis de controle dinâmico do Banner (Absolute Meta)
let slideAtualBanner = 0;
let totalSlidesBanner = 0;
let intervaloAutoplayBanner = null;

// Filtros e busca ativos na Tela Inicial (Home)
let filtroHomeJogo = "TODOS";
let filtroHomeClasse = "TODAS";
let termoBuscaHome = "";

// Filtros ativos no Armeiro (Gunsmith)
let filtroJogoAtual = "TODOS";
let filtroClasseAtual = "TODAS";

// Filtro ativo na Comunidade
let filtroArmaComunidade = "TODAS";

// Mapeamento de Logos dos Jogos
function obterLogoJogo(jogo) {
    const mapaLogos = {
        "MW2": "logos/mw2-logo.svg",
        "MW3": "logos/mw3-logo.svg",
        "BO6": "logos/bo6-logo.svg",
        "BO7": "logos/bo7-logo.svg"
    };
    return mapaLogos[jogo] || "logos/cod-logo.svg";
}

// Mapeamento de Kits de Conversão Aftermarket
const kitsConversaoPorArma = {
    "RENETTI": ["Kit de Conversão Carabina JAK Ferocity"],
    "PULEMYOT 762": ["Kit Bullpup JAK Annihilator"],
    "COR-45": ["Kit de Conversão Binária JAK"],
    "MCW": ["Kit de Conversão JAK Raven (.300 BLK)"],
    "HOLGER 556": ["Kit de Conversão JAK Backsaw"],
    "DG-58 LSW": ["Kit de Conversão JAK Requiem"],
    "HAYMAKER": ["Kit JAK Maglift (Tambor Especial)"],
    "LOCKWOOD 680": ["Kit de Conversão Gatilho Duplo"],
    "BP50": ["Kit de Conversão JAK Revenger 9mm"],
    "BAL-27": ["Kit de Conversão JAK Annihilator Laser"],
    "AMR9": ["Kit de Conversão Carabina JAK Atlas"],
    "RIVAL-9": ["Kit de Conversão Headhunter JAK Carbine"],
    "M4": ["Kit de Conversão JAK Patriot"],
    "KASTOV 762": ["Kit JAK Cataclysm .50 Cal"],
    "RPK": ["Kit JAK Cataclysm Sniper"],
    "LOCKWOOD 300": ["Gatilho Maelstrom Duplo"],
    "LOCKWOOD MK2": ["Kit JAK Wardens Akimbo"],
    "KV BROADSIDE": ["Kit JAK Jawbreaker"],
    "TYR": ["Kit JAK Beholder Rifle"],
    "VX-COMPACT": ["Kit de Conversão Carabina VX"],
    "CODA 9": ["Kit Micro-Carabina CODA 2035"]
};

const slotsBloqueadosPorKit = {
    "Kit de Conversão Carabina JAK Ferocity": ["slot-coronha", "slot-cano"],
    "Kit Bullpup JAK Annihilator": ["slot-coronha", "slot-cano"],
    "Kit de Conversão Binária JAK": ["slot-gatilho"],
    "Kit de Conversão JAK Raven (.300 BLK)": ["slot-cano", "slot-coronha"],
    "Kit de Conversão JAK Backsaw": ["slot-cano", "slot-coronha"],
    "Kit de Conversão JAK Requiem": ["slot-cano"],
    "Kit JAK Maglift (Tambor Especial)": ["slot-carregador"],
    "Kit de Conversão Gatilho Duplo": ["slot-gatilho"],
    "Kit de Conversão JAK Revenger 9mm": ["slot-carregador", "slot-coronha"],
    "Kit de Conversão JAK Annihilator Laser": ["slot-laser", "slot-cano"],
    "Kit de Conversão Carabina JAK Atlas": ["slot-coronha", "slot-cano"],
    "Kit de Conversão Headhunter JAK Carbine": ["slot-coronha"],
    "Kit de Conversão JAK Patriot": ["slot-cano", "slot-gatilho"],
    "Kit JAK Cataclysm .50 Cal": ["slot-carregador", "slot-cano"],
    "Kit JAK Cataclysm Sniper": ["slot-carregador", "slot-cano"],
    "Gatilho Maelstrom Duplo": ["slot-gatilho"],
    "Kit JAK Wardens Akimbo": ["slot-coronha", "slot-cano"],
    "Kit JAK Jawbreaker": ["slot-carregador", "slot-cano"],
    "Kit JAK Beholder Rifle": ["slot-cano", "slot-coronha"],
    "Kit de Conversão Carabina VX": ["slot-coronha", "slot-cano"],
    "Kit Micro-Carabina CODA 2035": ["slot-coronha", "slot-cano"]
};

const themeVideos = {
    mw4: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/mw2.webm",
    mw3: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/mw3.webm",
    bo6: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/bo6.webm",
    bo7: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/bo7.webm"
};

// Processa token OAuth na URL (se veio do Facebook/Google via redirect)
(function handleOAuthHash() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return;
    if (!supabaseClient) return;
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const expires_in = params.get('expires_in');
    if (access_token) {
        supabaseClient.auth.setSession({ access_token, refresh_token, expires_in: parseInt(expires_in || '3600') }).then(({ error }) => {
            if (!error) {
                window.history.replaceState(null, '', window.location.pathname);
                checkLoginStatus();
                loadCommunityBuilds(true);
            }
        });
    }
})();

const themeParticleColors = {
    mw4: ["#4ade80", "#22c55e", "#86efac", "#16a34a", "#ffffff"],
    mw3: ["#ef4444", "#dc2626", "#f87171", "#b91c1c", "#ff9999"],
    bo6: ["#ff5500", "#ff6a00", "#ff7700", "#ff8c00", "#ffa600"],
    bo7: ["#38bdf8", "#0ea5e9", "#7dd3fc", "#0284c7", "#e0f2fe"]
};

// ========================================================
//  0. CONFIGURAÇÃO FIREBASE (novo banco)
// ========================================================
// Usa db/auth global criados em firebase-config.js (compat)
const useFirebase = (typeof db !== 'undefined' && db !== null) && (typeof auth !== 'undefined' && auth !== null);

// ========================================================
//  2. IDENTIFICADORES DE JOGO E CLASSE DE ARMA            |
// ========================================================
function obterJogoDaArma(arma) {
    if (arma && arma.jogo) return arma.jogo.toUpperCase();

    const nome = (arma.nome || "").toUpperCase();

    const bo6Armas = [
        "AMES 85", "XM4", "JACKAL PDW", "C9", "KSV", "LR 7.62", "XMG", 
        "AS VAL", "GPR 91", "MODEL L", "KRIG C", "GOBLIN MK 2", "KOMPAKT 92", 
        "TANTO .22", "PP-919", "SAUG", "MARINE SP", "ASG-89", "PU-21", "GPMG-7", 
        "SWAT 5.56", "AEK-973", "DM-10", "TSARKOV 7.62", "ESSEX MODEL 07", 
        "LW3A1 FROSTLINE", "SVD", "9MM PM", "GREKHOVA", "GS45", "SIRIN 9MM", 
        "CIGMA 2B", "HE-1", "KNIFE"
    ];
    if (bo6Armas.some(w => nome.includes(w))) return "BO6";

    const bo7Armas = [
        "AN-94", "REV-46", "MK35-ISR", "RYDEN-45K", "FG42", "VST", "STRIDER-300", 
        "DS20-MIRAGE", "MPC-25", "AK-27", "STURMWOLF-45", "VX-COMPACT", "CBRS-3", 
        "VOYAK-KT-3", "M15-MOD-0", "PEACEKEEPER-MK1", "VS-RECON", "HAWKER-HX", 
        "MXR-17", "CARBON 57", "RAZOR 9MM", "DRAVEC 45", "XR-3 ION", "SHADOW SK", 
        "XM325", "AKITA", "CODA 9", "1911", "ABR A1", "AK-74", "AMR MOD 4", 
        "CR-56 AMAX", "CYPHER 091", "D13 SECTOR", "DRESDEN 9MM", "ECHO 12", 
        "EGRT-17", "FENG 82", "FFAR 1", "GRAVEMARK .357", "GREMLIN", "HDR", 
        "J-GER 45", "KILO 141", "KOGOT-7", "KRS-762", "LADRA", "LC10", 
        "M10 BREACHER", "M34 NOVALINE", "M8A1", "MADDOX RFB", "MAELSTROM", 
        "MERRICK 556", "MK78", "NAIL GUN", "OLYMPIA", "PML-556", "POWER DRILL", 
        "PPSH-41", "RK-9", "SG-12", "SOKOL 545", "STRYDER 22", "SWORDFISH A1", 
        "TR2", "VELOX 57", "X52 RESONATOR", "X9 MAVERICK"
    ];
    if (bo7Armas.some(w => nome.includes(w))) return "BO7";

    const mw2Armas = [
        "KASTOV 762", "M4", "LACHMANN SUB", "VEL 46", "TAQ-56", "M13B", 
        "ISO HEMLOCK", "CHIMERA", "VAZNEV-9K", "FSS HURRICANE", "RPK", 
        "LOCKWOOD 300", "LOCKWOOD MK2", "KV BROADSIDE", "FJX IMPERIUM", 
        "MCPR-300", "SIGNAL 50", "VICTUS XMR", "SP-R 208", "SA-B 50", 
        "LACHMANN-556", "STB 556", "FTAC SIEGE", "50 GS"
    ];
    if (mw2Armas.some(w => nome.includes(w))) return "MW2";

    return "MW3";
}

function obterClasseDaArma(arma) {
    const tipo = (arma.tipo || "").toLowerCase().trim();
    const nome = (arma.nome || "").toUpperCase().trim();

    // O campo "tipo" do JSON é a fonte da verdade; as listas abaixo só cobrem tipos desconhecidos
    if (CLASSE_POR_TIPO[tipo]) return CLASSE_POR_TIPO[tipo];

    if (tipo.includes("espingarda") || tipo.includes("shotgun")) return "Espingardas";
    const shotgunNomes = [
        "LOCKWOOD", "HAYMAKER", "AKITA", "MARINE SP", "ASG-89", "ECHO 12",
        "M10 BREACHER", "MAELSTROM", "OLYMPIA", "SG-12", "RECLAIMER 18",
        "KV BROADSIDE", "BRYSON", "RIVETER", "EXPEDITE 12", "MX GUARDIAN"
    ];
    if (shotgunNomes.some(w => nome.includes(w))) return "Espingardas";

    if (tipo.includes("smt") || tipo.includes("submetralhadora") || tipo.includes("smg")) return "SMT";
    const smgNomes = [
        "REV-46", "RYDEN-45K", "MPC-25", "STURMWOLF-45", "SUPERI", "STRIKER",
        "HRM-9", "FJX HORUS", "WSP", "RIVAL-9", "LACHMANN SUB", "JACKAL",
        "C9", "KSV", "CARBON 57", "RAZOR", "DRAVEC", "KOMPAKT 92", "TANTO .22",
        "PP-919", "SAUG", "DRESDEN 9MM", "LADRA", "LC10", "PPSH-41", "RK-9",
        "VELOX 57", "VEL 46", "VAZNEV-9K", "FSS HURRICANE", "STATIC-HV", "RAM-9", "AMR9",
        "BAS-P", "FENNEC 45", "ISO 45", "ISO 9MM", "MINIBAK", "MX9", "PDSW 528", "LACHMANN SHROUD"
    ];
    if (smgNomes.some(w => nome.includes(w))) return "SMT";

    if (tipo.includes("precisão") || tipo.includes("precisao") || tipo.includes("sniper")) return "Fuzis de Precisão";
    const sniperNomes = [
        "HAWKER-HX", "HAWKER", "M34 NOVALINE", "NOVALINE", "XRK STALKER", "MORS",
        "KATT-AMR", "LONGBOW", "KV INHIBITOR", "LR 7.62", "LW3A1 FROSTLINE", "SVD",
        "MCPR-300", "SIGNAL 50", "VICTUS XMR", "SP-X 80", "LA-B 330", "CARRACK .300",
        "FJX IMPERIUM", "AMR MOD 4", "HDR", "SHADOW SK", "STRIDER-300", "XR-3 ION"
    ];
    if (sniperNomes.some(w => nome.includes(w))) return "Fuzis de Precisão";

    if (tipo.includes("atirador") || tipo.includes("marksman")) return "Fuzis de Atirador";
    const atiradorNomes = [
        "KAR98K", "MK35-ISR", "VS-RECON", "DS20-MIRAGE", "SWAT 5.56", "AEK-973",
        "DM-10", "TSARKOV 7.62", "ESSEX MODEL 07", "LOCKWOOD MK2", "SP-R 208",
        "SA-B 50", "TEMPUS TORRENT", "EBR-14", "LM-S", "DM56", "MTZ INTERCEPTOR",
        "MCW 6.8", "KVD ENFORCER", "WARDEN 308", "CROSSBOW", "TAQ-M"
    ];
    if (atiradorNomes.some(w => nome.includes(w))) return "Fuzis de Atirador";

    if ((tipo.includes("ml") || tipo.includes("lmg") || tipo.includes("metralhadora") || tipo.includes("leve")) && !tipo.includes("sub") && !tipo.includes("smt")) return "ML";
    const lmgNomes = [
        "DG-58 LSW", "PULEMYOT", "BRUEN MK9", "XMG", "XM325", "PU-21", "GPMG-7",
        "FENG 82", "MK78", "PML-556", "RPK", "SAKIN MG38", "RAAL MG", "RAPP H",
        "HCR 56", "HOLGER 26", "TAQ ERADICATOR", "TAQ EVOLVERE", "KASTOV LSW", "556 ICARUS"
    ];
    if (lmgNomes.some(w => nome.includes(w))) return "ML";

    if (tipo.includes("batalha") || tipo.includes("battle") || tipo === "br") return "Fuzis de Batalha";
    const battleRifles = [
        "BAS-B", "SIDEWINDER", "MTZ-762", "SOA SUBVERTER", "DTIR 30-06",
        "LACHMANN-762", "FTAC RECON", "SO-14", "TAQ-V", "CRONEN SQUALL", "CBRS-3"
    ];
    if (battleRifles.some(w => nome.includes(w))) return "Fuzis de Batalha";

    if (tipo.includes("pistola") || tipo.includes("handgun")) return "Pistolas";
    const pistolaNomes = [
        "RENETTI", "COR-45", "CODA 9", "9MM PM", "GREKHOVA", "GS45",
        "SIRIN 9MM", "1911", "GRAVEMARK .357", "GREMLIN", "J-GER 45", "STRYDER 22",
        "FTAC SIEGE", "50 GS", "TYR", "WSP STINGER", "X12", "X13 AUTO", "P890",
        "BASILISK", "9MM DAEMON", "GS MAGNA"
    ];
    if (pistolaNomes.some(w => nome.includes(w))) return "Pistolas";

    return "Fuzis de Assalto";
}

function obterPoolDoJogo(jogo) {
    if (!acessoriosGlobais) return {};

    if (jogo === "BO6" && acessoriosGlobais.black_ops_6) {
        return acessoriosGlobais.black_ops_6;
    }
    if (jogo === "BO7" && acessoriosGlobais.black_ops_7) {
        return acessoriosGlobais.black_ops_7;
    }
    if ((jogo === "MW2" || jogo === "MW3") && acessoriosGlobais.modern_warfare) {
        return acessoriosGlobais.modern_warfare;
    }

    return acessoriosGlobais;
}

// ========================================================
//  3. CARREGAMENTO DOS JSONs                              |
// ========================================================
async function carregarDadosIniciais() {
    const container = document.querySelector("#home .grid-armas");

    try {
        const timestamp = Date.now();
        const [resBO6, resBO7, resMW2, resMW3, resAcessorios] = await Promise.all([
            fetch(`./armas_bo6.json?v=${timestamp}`),
            fetch(`./armas_bo7.json?v=${timestamp}`),
            fetch(`./armas_mw2.json?v=${timestamp}`),
            fetch(`./armas_mw3.json?v=${timestamp}`),
            fetch(`./acessorios.json?v=${timestamp}`)
        ]);

        if (resBO6.ok && resBO7.ok && resMW2.ok && resMW3.ok && resAcessorios.ok) {
            const [bo6, bo7, mw2, mw3, acessorios] = await Promise.all([
                resBO6.json(),
                resBO7.json(),
                resMW2.json(),
                resMW3.json(),
                resAcessorios.json()
            ]);

            listaMetaArmas = [...bo6, ...bo7, ...mw2, ...mw3];
            acessoriosGlobais = acessorios;
        } else {
            throw new Error("Arquivos segmentados não encontrados.");
        }
    } catch (err) {
        console.warn("Recorrendo ao arquivo único armas.json...", err);
        try {
            const timestamp = Date.now();
            const [resArmas, resAcessorios] = await Promise.all([
                fetch(`./armas.json?v=${timestamp}`),
                fetch(`./acessorios.json?v=${timestamp}`)
            ]);
            listaMetaArmas = await resArmas.json();
            acessoriosGlobais = await resAcessorios.json();
        } catch (err2) {
            console.error("Erro crítico ao carregar dados:", err2);
            if (container) {
                container.innerHTML = `<p style="color: var(--accent); text-align: center; padding: 2rem;">Erro ao ler os dados do catálogo. Certifique-se de executar via Live Server.</p>`;
            }
            return;
        }
    }

    // Inicializa o Banner Dinâmico com todas as armas Tier S
    renderizarBannerAnuncio(listaMetaArmas);

    aplicarFiltrosHome();
    inicializarArmeiro();
    inicializarBuildsComunidadePadrao();
    loadCommunityBuilds(true);
}

// ========================================================
//  BANNER ESTILO ANÚNCIO (DINÂMICO PARA N ARMAS TIER S)   |
// ========================================================
function renderizarBannerAnuncio(listaCompleta) {
    const track = document.getElementById("adBannerTrack");
    const dotsContainer = document.getElementById("adDotsContainer");
    const prevBtn = document.getElementById("adPrevBtn");
    const nextBtn = document.getElementById("adNextBtn");
    const secaoBanner = document.getElementById("secaoMetaBanner");

    if (!track || !dotsContainer) return;

    // Filtra todas as armas que estiverem no Tier S
    const armasAbsoluteMeta = listaCompleta.filter(arma => (arma.tier || "").toUpperCase() === "TIER S");
    totalSlidesBanner = armasAbsoluteMeta.length;

    // Se nenhuma estiver classificada como S, esconde o banner
    if (totalSlidesBanner === 0) {
        if (secaoBanner) secaoBanner.style.display = "none";
        return;
    } else {
        if (secaoBanner) secaoBanner.style.display = "block";
    }

    track.innerHTML = "";
    dotsContainer.innerHTML = "";
    slideAtualBanner = 0;

    armasAbsoluteMeta.forEach((arma, index) => {
        const slide = document.createElement("div");
        slide.className = "ad-slide-item";

        const jogoArma = obterJogoDaArma(arma);
        const classeArma = obterClasseDaArma(arma);

        slide.innerHTML = `
            <div class="ad-slide-info">
                <span class="ad-meta-tag">ABSOLUTE META</span>
                <h2>${escapeHTML(arma.nome)}</h2>
                <p>${classeArma} • ${jogoArma}</p>
                <div class="ad-slide-actions">
                    <button type="button" onclick="abrirNoArmeiro(${jsArg(arma.nome)})" style="background: var(--accent); color: #000;">
                        Ver no Armeiro
                    </button>
                    <button type="button" onclick="abrirNaComunidade(${jsArg(arma.nome)})" style="background: #2a2e3d; color: #fff; border: 1px solid #3f4458;">
                        Builds da Galera
                    </button>
                </div>
            </div>
            <div class="ad-slide-image">
                <img 
                    src="${ASSETS_CDN + arma.arquivo_imagem}" 
                    alt="${escapeHTML(arma.nome)}"
                    onerror="this.style.display='none'"
                >
            </div>
        `;
        track.appendChild(slide);

        // Gera exatamente 1 bolinha por arma Tier S (3, 5 ou mais)
        const dot = document.createElement("div");
        dot.className = `ad-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener("click", () => {
            irParaSlideBanner(index);
            reiniciarAutoplayBanner();
        });
        dotsContainer.appendChild(dot);
    });

    // Controles das setas
    if (nextBtn) {
        nextBtn.onclick = () => {
            slideAtualBanner = (slideAtualBanner + 1) % totalSlidesBanner;
            atualizarPosicaoSlideBanner();
            reiniciarAutoplayBanner();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            slideAtualBanner = (slideAtualBanner - 1 + totalSlidesBanner) % totalSlidesBanner;
            atualizarPosicaoSlideBanner();
            reiniciarAutoplayBanner();
        };
    }

    atualizarPosicaoSlideBanner();
    iniciarAutoplayBanner();
}

function atualizarPosicaoSlideBanner() {
    const track = document.getElementById("adBannerTrack");
    const dots = document.querySelectorAll(".ad-dot");

    if (!track) return;
    track.style.transform = `translateX(-${slideAtualBanner * 100}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === slideAtualBanner);
    });
}

function irParaSlideBanner(index) {
    slideAtualBanner = index;
    atualizarPosicaoSlideBanner();
}

function iniciarAutoplayBanner() {
    pararAutoplayBanner();
    intervaloAutoplayBanner = setInterval(() => {
        if (totalSlidesBanner > 0) {
            slideAtualBanner = (slideAtualBanner + 1) % totalSlidesBanner;
            atualizarPosicaoSlideBanner();
        }
    }, 4500);
}

function pararAutoplayBanner() {
    if (intervaloAutoplayBanner) clearInterval(intervaloAutoplayBanner);
}

function reiniciarAutoplayBanner() {
    pararAutoplayBanner();
    iniciarAutoplayBanner();
}

// ========================================================
//  4. BUSCA, FILTROS & ORDENAÇÃO POR META                 |
// ========================================================
function filtrarHomeBusca(termo) {
    termoBuscaHome = (termo || "").trim().toLowerCase();
    aplicarFiltrosHome();
}

function toggleFiltrosHome() {
    const painel = document.getElementById("homeFilterPanel");
    const seta = document.getElementById("homeFilterArrow");
    const btn = document.getElementById("btnToggleHomeFilters");
    if (!painel) return;

    const estaAberto = painel.style.display === "flex" || painel.style.display === "block";

    if (estaAberto) {
        painel.style.display = "none";
        if (seta) seta.textContent = "▼";
        if (btn) {
            btn.style.background = "#1a1d26";
            btn.style.borderColor = "#2e3545";
            btn.style.color = "#fff";
        }
    } else {
        painel.style.display = "flex";
        if (seta) seta.textContent = "▲";
        if (btn) {
            btn.style.background = "var(--accent)";
            btn.style.borderColor = "var(--accent)";
            btn.style.color = "#000";
        }
    }
}

function filtrarHomeJogo(jogo, btnClicado) {
    filtroHomeJogo = jogo;

    document.querySelectorAll(".btn-filter-home-jogo").forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "#1a1d26";
        btn.style.color = "#fff";
        btn.style.borderColor = "#2e3545";
    });

    if (btnClicado) {
        btnClicado.classList.add("active");
        btnClicado.style.background = "var(--accent)";
        btnClicado.style.color = "#000";
        btnClicado.style.borderColor = "var(--accent)";
    }

    aplicarFiltrosHome();
}

function filtrarHomeClasse(classe, btnClicado) {
    filtroHomeClasse = classe;

    document.querySelectorAll(".btn-filter-home-classe").forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "#1a1d26";
        btn.style.color = "#fff";
        btn.style.borderColor = "#2e3545";
    });

    if (btnClicado) {
        btnClicado.classList.add("active");
        btnClicado.style.background = "var(--accent)";
        btnClicado.style.color = "#000";
        btnClicado.style.borderColor = "var(--accent)";
    }

    aplicarFiltrosHome();
}

function pontuarTierMeta(arma) {
    const tier = (arma.tier || "").toUpperCase();
    if (tier === "TIER S") return 100;
    if (tier === "TIER A") return 80;
    if (tier === "TIER B") return 60;
    if (tier === "TIER C") return 40;
    if (tier === "TIER D") return 20;
    return 0; // Tier E
}

function aplicarFiltrosHome() {
    let armasFiltradas = listaMetaArmas.filter(arma => {
        const matchJogo = (filtroHomeJogo === "TODOS" || obterJogoDaArma(arma) === filtroHomeJogo);
        const matchClasse = (filtroHomeClasse === "TODAS" || obterClasseDaArma(arma) === filtroHomeClasse);
        const matchBusca = !termoBuscaHome || (arma.nome && arma.nome.toLowerCase().includes(termoBuscaHome));
        return matchJogo && matchClasse && matchBusca;
    });

    armasFiltradas.sort((a, b) => {
        const pontuacaoA = pontuarTierMeta(a);
        const pontuacaoB = pontuarTierMeta(b);
        if (pontuacaoB !== pontuacaoA) {
            return pontuacaoB - pontuacaoA;
        }
        return (a.nome || "").localeCompare(b.nome || "");
    });

    renderMetaCards(armasFiltradas);
}

function renderMetaCards(armas) {
    const container = document.querySelector("#home .grid-armas");
    if (!container) return;
    const modoLista = localStorage.getItem("wz_arsenal_view") || "grid";
    container.style.display = modoLista === "lista" ? "block" : "grid";
    container.innerHTML = "";

    if (armas.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #8c8ea3; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px dashed #2a2e3d;">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #fff;">Nenhuma arma encontrada</p>
                <small>Tente buscar por outro nome ou altere os filtros selecionados.</small>
            </div>
        `;
        return;
    }

    if (modoLista === "lista") {
        const grupos = {};
        armas.forEach(arma => {
            const tier = (arma.tier || "Tier E").toUpperCase();
            if (!grupos[tier]) grupos[tier] = [];
            grupos[tier].push(arma);
        });
        const ordem = ["TIER S","TIER A","TIER B","TIER C","TIER D","TIER E"];
        const ordemExistente = ordem.filter(t => grupos[t] && grupos[t].length > 0);
        container.innerHTML = `
            <div style="width: 100%; display: flex; flex-direction: column; gap: 1rem;">` +
            ordemExistente.map(tier => {
                const armasTier = grupos[tier];
                const corTier = tier === "TIER S" ? "#f59e0b" : tier === "TIER A" ? "#4ade80" : tier === "TIER B" ? "#38bdf8" : tier === "TIER C" ? "#eab308" : tier === "TIER D" ? "#ef4444" : "#2e3545";
                return `<div style="background: rgba(12,14,22,0.88); border: 1px solid ${corTier}; border-radius: 8px; overflow: hidden;">
                    <div style="background: ${corTier}99; color: #fff; font-weight: 800; font-size: 0.85rem; padding: 0.6rem 1rem; letter-spacing: 1px;">${tier === "TIER S" ? "★ META ABSOLUTO" : tier}</div>
                    <div style="padding: 0.8rem; display: flex; flex-direction: column; gap: 0.6rem;">` +
                    armasTier.map(arma => {
                        const jogoArma = obterJogoDaArma(arma);
                        const logoJogo = obterLogoJogo(jogoArma);
                        return `<div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.4rem; border-bottom: 1px solid #232a35;"
                            onmouseover="this.style.background='#161820'" onmouseout="this.style.background='transparent'">
                            <img src="${ASSETS_CDN + arma.arquivo_imagem}" alt="${escapeHTML(arma.nome)}" style="max-height: 40px; max-width: 90px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7));" onerror="this.style.display='none'">
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${escapeHTML(arma.nome)}</div>
                                <div style="font-size: 0.78rem; color: #8c8ea3;">${escapeHTML(arma.tipo || "Arma Meta")}</div>
                            </div>
                            <img src="${ASSETS_CDN + logoJogo}" alt="${jogoArma}" style="height: 24px; width: 24px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));" onerror="this.style.display='none'">
                            <button onclick="abrirNoArmeiro(${jsArg(arma.nome)})" style="padding: 0.35rem 0.7rem; background: var(--accent); color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.78rem;">Armeiro</button>
                            <button onclick="abrirNaComunidade(${jsArg(arma.nome)})" style="padding: 0.35rem 0.7rem; background: #2a2e3d; color: #fff; border: 1px solid #3f4458; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.78rem;">Comunidade</button>
                        </div>`;
                    }).join("") +
                    `</div></div>`;
            }).join("") +
            `</div>`;
        return;
    }

    armas.forEach(arma => {
        const card = document.createElement("div");
        card.className = "card";

        const tierClass = (arma.tier || "Tier E").toLowerCase().replace(/\s+/g, "-");
        const jogoArma = obterJogoDaArma(arma);
        const logoJogo = obterLogoJogo(jogoArma);
        const isMetaTierS = (arma.tier || "").toUpperCase() === "TIER S";

        if (isMetaTierS) {
            card.style.borderColor = "var(--accent)";
            card.style.boxShadow = "0 4px 14px rgba(0,0,0,0.6)";
        }

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tier ${tierClass}" style="${isMetaTierS ? 'background: var(--accent); color: #000; font-weight: 800;' : ''}">
                    ${isMetaTierS ? '★ META ABSOLUTO' : (arma.tier || 'Tier E')}
                </span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}" 
                    style="height: 40px; max-width: 80px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));"
                    onerror="this.style.display='none'"
                >
            </div>

            <div style="width: 100%; height: 115px; display: flex; align-items: center; justify-content: center; margin: 0.5rem 0;">
                <img 
                    src="${ASSETS_CDN + arma.arquivo_imagem}" 
                    alt="${escapeHTML(arma.nome)}" 
                    style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            </div>

            <h3>${escapeHTML(arma.nome)}</h3>
            <p class="tipo">${escapeHTML(arma.tipo || "Arma Warzone")}</p>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.8rem;">
                <button 
                    class="btn-submit" 
                    onclick="abrirNoArmeiro(${jsArg(arma.nome)})" 
                    style="flex: 1; padding: 0.65rem 0.3rem; font-weight: bold; background: var(--accent); color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; text-align: center;">
                    Armeiro
                </button>
                <button 
                    class="btn-submit" 
                    onclick="abrirNaComunidade(${jsArg(arma.nome)})" 
                    style="flex: 1; padding: 0.65rem 0.3rem; font-weight: bold; background: #2a2e3d; color: #fff; border: 1px solid #3f4458; border-radius: 4px; cursor: pointer; font-size: 0.8rem; text-align: center;">
                    Comunidade
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

function abrirNoArmeiro(nomeArma) {
    const index = listaMetaArmas.findIndex(w => w.nome.toUpperCase() === nomeArma.toUpperCase());
    if (index === -1) return;

    const arma = listaMetaArmas[index];

    filtroJogoAtual = "TODOS";
    filtroClasseAtual = "TODAS";

    document.querySelectorAll(".btn-filter-armeiro").forEach(btn => {
        const isTodos = btn.textContent.trim().toUpperCase() === "TODOS";
        btn.classList.toggle("active", isTodos);
        btn.style.background = isTodos ? "var(--accent)" : "#1a1d26";
        btn.style.color = isTodos ? "#000" : "#fff";
        btn.style.borderColor = isTodos ? "var(--accent)" : "#2e3545";
    });

    document.querySelectorAll(".btn-filter-classe").forEach(btn => {
        const isTodas = btn.textContent.trim().toUpperCase() === "TODAS";
        btn.classList.toggle("active", isTodas);
        btn.style.background = isTodas ? "var(--accent)" : "#1a1d26";
        btn.style.color = isTodas ? "#000" : "#fff";
        btn.style.borderColor = isTodas ? "var(--accent)" : "#2e3545";
    });

    popularSelectArmas();
    const selectArmeiro = document.getElementById("gunsmithWeaponSelect");
    if (selectArmeiro) {
        selectArmeiro.value = index;
        atualizarArmeiro();
    }

    if (arma.acessorios && Array.isArray(arma.acessorios)) {
        limparSlots();

        const mapaSlots = {
            "boca": "slot-boca",
            "cano": "slot-cano",
            "laser": "slot-laser",
            "mira": "slot-mira",
            "coronha": "slot-coronha",
            "acoplamento": "slot-acoplamento",
            "carregador": "slot-carregador",
            "munição": "slot-municao",
            "municao": "slot-municao",
            "gatilho": "slot-gatilho",
            "gatilho/modo": "slot-gatilho",
            "cabo": "slot-cabo",
            "kit de conversão": "slot-kit-conversao",
            "kit conversao": "slot-kit-conversao"
        };

        arma.acessorios.forEach(acc => {
            if (typeof acc === "object" && acc.slot && acc.nome) {
                const chaveSlot = acc.slot.toLowerCase().trim();
                const elementId = mapaSlots[chaveSlot];
                if (elementId) {
                    const selElement = document.getElementById(elementId);
                    if (selElement && !selElement.disabled) {
                        const optMatch = Array.from(selElement.options).find(o => o.value === acc.nome)
                            || Array.from(selElement.options).find(o => o.value && o.textContent.includes(acc.nome));
                        if (optMatch) {
                            selElement.value = optMatch.value;
                        } else {
                            const newOpt = document.createElement("option");
                            newOpt.value = acc.nome;
                            newOpt.textContent = acc.nome;
                            selElement.appendChild(newOpt);
                            selElement.value = acc.nome;
                        }
                    }
                }
            }
        });

        atualizarContadorSlots();
    }

    const navItemArmeiro = document.querySelector("a[onclick*=\"'armeiro'\"]");
    showSection(null, 'armeiro', navItemArmeiro);
}

function abrirNaComunidade(nomeArma) {
    filtroArmaComunidade = nomeArma;

    const select = document.getElementById("communityWeaponFilter");
    if (select) {
        const optExiste = Array.from(select.options).some(o => o.value.toUpperCase() === nomeArma.toUpperCase());
        if (!optExiste) {
            const newOpt = document.createElement("option");
            newOpt.value = nomeArma;
            newOpt.textContent = `${nomeArma} (0 builds)`;
            select.appendChild(newOpt);
        }
        select.value = nomeArma;
    }

    loadCommunityBuilds(false);

    const navItemComunidade = document.querySelector("a[onclick*=\"'comunidade'\"]");
    showSection(null, 'comunidade', navItemComunidade);
}

// ========================================================
//  5. BANCADA DO ARMEIRO                                  |
// ========================================================
function filtrarArmasArmeiro(jogo, btnClicado) {
    filtroJogoAtual = jogo;

    document.querySelectorAll(".btn-filter-armeiro").forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "#1a1d26";
        btn.style.color = "#fff";
        btn.style.borderColor = "#2e3545";
    });

    if (btnClicado) {
        btnClicado.classList.add("active");
        btnClicado.style.background = "var(--accent)";
        btnClicado.style.color = "#000";
        btnClicado.style.borderColor = "var(--accent)";
    }

    popularSelectArmas();
}

function filtrarClasseArmeiro(classe, btnClicado) {
    filtroClasseAtual = classe;

    document.querySelectorAll(".btn-filter-classe").forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "#1a1d26";
        btn.style.color = "#fff";
        btn.style.borderColor = "#2e3545";
    });

    if (btnClicado) {
        btnClicado.classList.add("active");
        btnClicado.style.background = "var(--accent)";
        btnClicado.style.color = "#000";
        btnClicado.style.borderColor = "var(--accent)";
    }

    popularSelectArmas();
}

function popularSelectArmas() {
    const select = document.getElementById("gunsmithWeaponSelect");
    if (!select || !listaMetaArmas || listaMetaArmas.length === 0) return;

    select.innerHTML = "";

    const armasFiltradas = listaMetaArmas
        .map((arma, indexOriginal) => ({ arma, indexOriginal }))
        .filter(({ arma }) => {
            const matchJogo = (filtroJogoAtual === "TODOS" || obterJogoDaArma(arma) === filtroJogoAtual);
            const matchClasse = (filtroClasseAtual === "TODAS" || obterClasseDaArma(arma) === filtroClasseAtual);
            return matchJogo && matchClasse;
        });

    if (armasFiltradas.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = `Nenhuma arma (${filtroJogoAtual} / ${filtroClasseAtual})`;
        select.appendChild(opt);

        document.getElementById("gunsmithPreviewImg").style.display = "none";
        document.getElementById("gunsmithWeaponTitle").textContent = "Nenhuma arma";
        document.getElementById("gunsmithWeaponCategory").textContent = "-";
        
        const logoImg = document.getElementById("gunsmithGameLogo");
        if (logoImg) logoImg.style.display = "none";
        return;
    }

    armasFiltradas.forEach(({ arma, indexOriginal }) => {
        const opt = document.createElement("option");
        opt.value = indexOriginal;
        opt.textContent = arma.nome;
        select.appendChild(opt);
    });

    select.value = armasFiltradas[0].indexOriginal;
    atualizarArmeiro();
}

function inicializarArmeiro() {
    construirNosArmeiro();
    popularSelectArmas();
}

function atualizarArmeiro() {
    const selectArma = document.getElementById("gunsmithWeaponSelect");
    const img = document.getElementById("gunsmithPreviewImg");
    const titulo = document.getElementById("gunsmithWeaponTitle");
    const categoria = document.getElementById("gunsmithWeaponCategory");
    const gameLogo = document.getElementById("gunsmithGameLogo");

    if (!selectArma || !listaMetaArmas[selectArma.value]) return;

    const arma = listaMetaArmas[selectArma.value];
    const jogoArma = obterJogoDaArma(arma);
    const classeArma = obterClasseDaArma(arma);

    titulo.textContent = arma.nome;
    categoria.textContent = `${classeArma} • ${arma.tipo || "Arma Meta"}`;

    if (gameLogo) {
        gameLogo.src = ASSETS_CDN + obterLogoJogo(jogoArma);
        gameLogo.alt = jogoArma;
        gameLogo.title = jogoArma;
        gameLogo.style.display = "block";
    }

    img.src = ASSETS_CDN + arma.arquivo_imagem;
    img.style.display = "block";

    carregarAcessoriosNosSlots(arma);
    atualizarContadorSlots();
}

// Slots que certas classes de arma simplesmente não possuem (edite à vontade)
const slotsIndisponiveisPorClasse = {
    "Pistolas": ["slot-acoplamento"]
};

function carregarAcessoriosNosSlots(arma) {
    const jogoArma = obterJogoDaArma(arma);
    const pool = obterPoolDoJogo(jogoArma);
    const exclusivos = arma.acessorios_exclusivos || {};
    const bloqueadosClasse = slotsIndisponiveisPorClasse[obterClasseDaArma(arma)] || [];

    // Preenche o slot com as opções reais. Sem opções (ou bloqueado pela classe) => indisponível.
    const preencherSlot = (slotId, opcoes) => {
        const sel = document.getElementById(slotId);
        if (!sel) return;
        const reais = (opcoes || []).filter(o => o && o !== "Nenhum");
        const disponivel = reais.length > 0 && !bloqueadosClasse.includes(slotId);
        preencherSelectSimples(sel, ["Nenhum", ...(disponivel ? reais : [])]);
        sel.setAttribute("data-indisponivel", disponivel ? "false" : "true");
    };

    // Coronha só com "Sem Coronha" não é uma escolha de verdade => indisponível
    const coronhas = exclusivos.coronha || [];
    const coronhasValidas = coronhas.some(c => c !== "Sem Coronha") ? coronhas : [];

    preencherSlot("slot-boca", exclusivos.boca || pool.bocas);
    preencherSlot("slot-cano", exclusivos.cano);
    preencherSlot("slot-laser", exclusivos.laser || pool.lasers);
    preencherSlot("slot-mira", exclusivos.mira || pool.miras);
    preencherSlot("slot-coronha", coronhasValidas);
    preencherSlot("slot-acoplamento", exclusivos.acoplamento || pool.acoplamentos);
    preencherSlot("slot-carregador", exclusivos.carregador);
    preencherSlot("slot-municao", pool.municoes);
    preencherSlot("slot-gatilho", pool.modos_disparo);
    preencherSlot("slot-cabo", pool.cabos);

    configurarSlotKitConversao(arma);
}

function configurarSlotKitConversao(arma) {
    const slotKit = document.getElementById("slot-kit-conversao");
    if (!slotKit) return;

    const nomeUpper = (arma.nome || "").toUpperCase();
    const exclusivos = arma.acessorios_exclusivos || {};

    const kitsDoJson = exclusivos.kit_conversao || [];
    const kitsMapeados = kitsConversaoPorArma[nomeUpper] || [];
    const kitsDisponiveis = [...new Set([...kitsDoJson, ...kitsMapeados])];

    slotKit.innerHTML = "";

    if (kitsDisponiveis.length > 0) {
        slotKit.setAttribute("data-indisponivel", "false");
        
        const optPadrao = document.createElement("option");
        optPadrao.value = "";
        optPadrao.textContent = "Nenhum";
        slotKit.appendChild(optPadrao);

        kitsDisponiveis.forEach(kit => {
            const opt = document.createElement("option");
            opt.value = kit;
            opt.textContent = `★ ${kit}`;
            slotKit.appendChild(opt);
        });

        slotKit.disabled = false;
        slotKit.style.opacity = "1";
        slotKit.style.cursor = "pointer";
        slotKit.style.borderColor = "#f59e0b";
        slotKit.title = "Kit de Conversão Aftermarket disponível para esta arma!";
    } else {
        slotKit.setAttribute("data-indisponivel", "true");

        const optNao = document.createElement("option");
        optNao.value = "";
        optNao.textContent = "Não disponível para esta arma";
        slotKit.appendChild(optNao);

        slotKit.disabled = true;
        slotKit.style.opacity = "0.30";
        slotKit.style.cursor = "not-allowed";
        slotKit.style.borderColor = "#232a35";
        slotKit.title = "Esta arma não possui Kit de Conversão Aftermarket.";
    }
}

function preencherSelectSimples(selectElement, listaOpcoes) {
    if (!selectElement) return;
    selectElement.innerHTML = "";

    listaOpcoes.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item === "Nenhum" ? "" : item;
        opt.textContent = item;
        selectElement.appendChild(opt);
    });
}

function aplicarBloqueiosDoKit() {
    const slotKit = document.getElementById("slot-kit-conversao");
    const kitSelecionado = slotKit ? slotKit.value.trim() : "";

    const bloqueados = (kitSelecionado && slotsBloqueadosPorKit[kitSelecionado])
        ? slotsBloqueadosPorKit[kitSelecionado]
        : (kitSelecionado ? ["slot-coronha", "slot-cano"] : []);

    const todosSlotsComuns = [
        "slot-boca", "slot-cano", "slot-laser", "slot-mira", "slot-coronha",
        "slot-acoplamento", "slot-carregador", "slot-municao", "slot-gatilho", "slot-cabo"
    ];

    todosSlotsComuns.forEach(slotId => {
        const sel = document.getElementById(slotId);
        if (!sel) return;

        const label = sel.previousElementSibling;

        if (label && !label.getAttribute("data-orig-text")) {
            label.setAttribute("data-orig-text", label.textContent.trim());
        }

        if (bloqueados.includes(slotId)) {
            sel.setAttribute("data-bloqueado-kit", "true");
            sel.value = "";

            if (label) {
                const orig = label.getAttribute("data-orig-text");
                label.innerHTML = `${orig} <span style="color: #ef4444; font-size: 0.76rem; font-weight: bold;">(🔒 Bloqueado pelo Kit)</span>`;
            }
        } else {
            sel.removeAttribute("data-bloqueado-kit");

            if (label && label.getAttribute("data-orig-text")) {
                label.textContent = label.getAttribute("data-orig-text");
            }
        }
    });
}

function atualizarContadorSlots() {
    aplicarBloqueiosDoKit();

    const selects = document.querySelectorAll(".slot-gunsmith");
    let equipados = 0;

    selects.forEach(sel => {
        if (sel.value && sel.value !== "" && sel.value !== "Nenhum") {
            equipados++;
        }
    });

    const counter = document.getElementById("gunsmithSlotCounter");
    if (counter) {
        counter.textContent = `${Math.min(equipados, 5)} / 5`;
        counter.classList.toggle("cheio", equipados >= 5);
        counter.title = equipados >= 5 ? "Limite de 5 acessórios atingido" : "";
    }

    selects.forEach(sel => {
        const indisponivelArma = sel.getAttribute("data-indisponivel") === "true";
        const bloqueadoPeloKit = sel.getAttribute("data-bloqueado-kit") === "true";
        const estaVazio = !sel.value || sel.value === "" || sel.value === "Nenhum";

        if (indisponivelArma) {
            sel.disabled = true;
            sel.style.opacity = "0.30";
            sel.style.cursor = "not-allowed";
            sel.style.borderColor = "#232a35";
            return;
        }

        if (bloqueadoPeloKit) {
            sel.disabled = true;
            sel.style.opacity = "0.35";
            sel.style.cursor = "not-allowed";
            sel.style.borderColor = "#ef4444";
            sel.title = "Este slot foi bloqueado pelo Kit de Conversão equipado!";
            return;
        }

        if (equipados >= 5 && estaVazio) {
            sel.disabled = true;
            sel.style.opacity = "0.35";
            sel.style.cursor = "not-allowed";
            sel.style.borderColor = "#232a35";
            sel.title = "Limite de 5 acessórios atingido! Remova um item para liberar este slot.";
        } else {
            sel.disabled = false;
            sel.style.opacity = "1";
            sel.style.cursor = "pointer";
            sel.title = "";

            if (!estaVazio) {
                sel.style.borderColor = (sel.id === "slot-kit-conversao") ? "#f59e0b" : "#22c55e";
            } else {
                sel.style.borderColor = (sel.id === "slot-kit-conversao") ? "#f59e0b" : "#232a35";
            }
        }
    });

    renderizarArmeiroVisual();
}

function limparSlots() {
    const selects = document.querySelectorAll(".slot-gunsmith");
    selects.forEach(sel => {
        sel.value = "";
    });
    atualizarContadorSlots();
}

function obterAcessoriosEquipados() {
    const mapeamento = [
        { id: "slot-boca", nome: "Boca" },
        { id: "slot-cano", nome: "Cano" },
        { id: "slot-laser", nome: "Laser" },
        { id: "slot-mira", nome: "Mira" },
        { id: "slot-coronha", nome: "Coronha" },
        { id: "slot-acoplamento", nome: "Acoplamento" },
        { id: "slot-carregador", nome: "Carregador" },
        { id: "slot-municao", nome: "Munição" },
        { id: "slot-gatilho", nome: "Gatilho/Modo" },
        { id: "slot-cabo", nome: "Cabo" },
        { id: "slot-kit-conversao", nome: "Kit de Conversão" }
    ];

    const equipados = [];
    mapeamento.forEach(item => {
        const el = document.getElementById(item.id);
        const val = el ? el.value : null;
        if (val && val !== "" && val !== "Nenhum") {
            equipados.push({ slot: item.nome, acessorio: val });
        }
    });

    return equipados;
}

function publicarClasseNoMural(btn) {
    const logado = localStorage.getItem("wz_logged_user");
    if (!logado) { showSection(null, "login", null); return; }

    const select = document.getElementById("gunsmithWeaponSelect");
    const arma = listaMetaArmas[select.value];
    if (!arma) return;

    const equipados = obterAcessoriosEquipados();
    const author = document.getElementById("customClassNick").value.trim() || localStorage.getItem("wz_logged_user") || "Operador";
    const estilo = document.getElementById("customClassNotes").value.trim();

    let desc = equipados.length > 0 
        ? equipados.map(e => `${e.slot}: ${e.acessorio}`).join(" • ") 
        : "Build padrão básica";

    if (estilo) desc += ` [Foco: ${estilo}]`;

    const codeReal = document.getElementById("customClassCodeReal")?.value.trim();
    const code = codeReal ? codeReal : "";

    const builds = lerJSON("wz_community_builds", []);
    const novaBuild = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
        author, 
        weapon: `${arma.nome} (${obterJogoDaArma(arma)} - ${obterClasseDaArma(arma)})`, 
        desc, 
        code,
        img: arma.arquivo_imagem,
        likes: 0,
        liked: false,
        comments: []
    };

    // Salva local (cache)
    builds.unshift(novaBuild);
    localStorage.setItem("wz_community_builds", JSON.stringify(builds));

    // Publica no Firebase se disponível
    if (useFirebase && db) {
        db.collection('builds').add({
            id: novaBuild.id,
            author: novaBuild.author,
            weapon: novaBuild.weapon,
            descricao: novaBuild.desc,
            code: novaBuild.code,
            img: novaBuild.img,
            likes: novaBuild.likes,
            created_at: new Date(),
            comments: novaBuild.comments || []
        }).then(() => console.log("Build publicada no Firebase"))
          .catch(err => console.warn("Erro ao publicar no Firebase:", err));
    }

    loadCommunityBuilds(true);

    const original = btn.textContent;
    btn.textContent = "✓ Publicado com Sucesso!";
    setTimeout(() => {
        btn.textContent = original;
        const navComunidade = document.querySelector("a[onclick*=\"'comunidade'\"]");
        showSection(null, 'comunidade', navComunidade);
    }, 800);
}

// ========================================================
//  6. FEED, CURTIDAS, COMENTÁRIOS E SALVAR (COMUNIDADE)   |
// ========================================================
function inicializarBuildsComunidadePadrao() {
    // builds padrão removidos; comunidade inicia vazia apenas se ainda não tiver conteúdo
    if (lerJSON("wz_community_builds", []).length === 0) {
        localStorage.setItem("wz_community_builds", JSON.stringify([]));
    }
}

function filtrarComunidadePorArma() {
    const select = document.getElementById("communityWeaponFilter");
    if (select) {
        filtroArmaComunidade = select.value;
    }
    loadCommunityBuilds(false);
}

function atualizarSelectFiltroComunidade(builds) {
    const select = document.getElementById("communityWeaponFilter");
    if (!select) return;

    const valorAnterior = select.value || "TODAS";
    select.innerHTML = '<option value="TODAS">Todas as Armas (Ver Tudo)</option>';

    const armasComBuilds = new Set();
    builds.forEach(b => {
        if (b.weapon) {
            const nomeBase = b.weapon.split('(')[0].trim();
            armasComBuilds.add(nomeBase);
        }
    });

    const ordenadas = Array.from(armasComBuilds).sort();
    ordenadas.forEach(nome => {
        const opt = document.createElement("option");
        opt.value = nome;
        const qtd = builds.filter(b => b.weapon && b.weapon.toUpperCase().includes(nome.toUpperCase())).length;
        opt.textContent = `${nome} (${qtd} ${qtd === 1 ? 'build' : 'builds'})`;
        select.appendChild(opt);
    });

    if (Array.from(select.options).some(o => o.value === valorAnterior)) {
        select.value = valorAnterior;
    } else {
        select.value = "TODAS";
        filtroArmaComunidade = "TODAS";
    }
}

function atualizarComentarioDoc(docRef, texto, autorFinal, input, buildId) {
    docRef.get().then(docSnap => {
        const data = docSnap.exists ? docSnap.data() : {};
        const arr = Array.isArray(data.comments) ? [...data.comments] : [];
        arr.push({ author: autorFinal, text: texto, time: "Agora" });
        docRef.update({ comments: arr })
            .then(() => loadCommunityBuilds(false))
            .catch(err => console.warn("Erro ao atualizar comentário (doc):", err));
    });
}
function salvaLocalEAtualiza() {
    // Fallback simples se não achar doc no Firestore
    const list = lerJSON("wz_community_builds", []);
    const area = document.getElementById(`comentarios-secao-${document.activeElement ? document.activeElement.id : ''}`);
}

function loadCommunityBuilds(atualizarSelect = true) {
    if (useFirebase && db) {
        db.collection('builds').orderBy('created_at', 'desc').get().then(snapshot => {
            const buildsConvertidas = snapshot.docs.map(d => {
                const b = d.data();
                return {
                    id: d.id,
                    author: b.author,
                    weapon: b.weapon,
                    desc: b.descricao,
                    code: b.code,
                    img: b.img,
                    likes: b.likes || 0,
                    liked: false,
                    comments: b.comments || []
                };
            });
            const savedList = lerJSON("wz_saved_classes", []);
            renderCommunityBuilds(buildsConvertidas, savedList, atualizarSelect);
        }).catch(err => {
            console.warn("Erro ao buscar builds Firebase:", err);
            const list = lerJSON("wz_community_builds", []);
            renderCommunityBuilds(list, [], atualizarSelect);
        });
        return;
    }
    // Fallback local
    const list = lerJSON("wz_community_builds", []);
    const savedList = lerJSON("wz_saved_classes", []);
    renderCommunityBuilds(list, savedList, atualizarSelect);
}
function renderCommunityBuilds(list, savedList, atualizarSelect) {
    const container = document.getElementById("communityCards");
    const counterTag = document.getElementById("communityCountTag");
    if (!container) return;

    // Delegação de eventos para comentários (mobile + desktop)
    container.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (btn && btn.textContent.trim() === 'Enviar') {
            const input = btn.closest('div').querySelector('input[type="text"]');
            if (input) {
                const buildId = input.id.replace('input-comentario-', '');
                adicionarComentario({preventDefault: function() {}}, buildId);
                input.value = '';
            }
        }
    });

    if (atualizarSelect) {
        atualizarSelectFiltroComunidade(list);
    }

    const select = document.getElementById("communityWeaponFilter");
    const filtroAtual = select ? select.value : filtroArmaComunidade;

    const listaFiltrada = list.filter(b => {
        if (!filtroAtual || filtroAtual === "TODAS") return true;
        return (b.weapon || "").toUpperCase().includes(filtroAtual.toUpperCase());
    });

    if (counterTag) {
        counterTag.textContent = `${listaFiltrada.length} ${listaFiltrada.length === 1 ? 'build encontrada' : 'builds encontradas'}`;
    }

    container.innerHTML = "";

    if (listaFiltrada.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #8c8ea3; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px dashed #2a2e3d;">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #fff;">Nenhuma build encontrada</p>
                <small>Não há classes da comunidade para ${filtroAtual === "TODAS" ? "nenhuma arma ainda" : `a arma "${escapeHTML(filtroAtual)}"`}.</small>
            </div>
        `;
        return;
    }

    listaFiltrada.forEach(b => {
        const card = document.createElement("div");
        card.className = "card";
        card.id = `card-${b.id}`;

        let imgHtml = "";
        if (b.img) {
            imgHtml = `
                <div style="width: 100%; height: 90px; display: flex; align-items: center; justify-content: center; margin: 0.4rem 0;">
                    <img src="${ASSETS_CDN + b.img}" alt="${escapeHTML(b.weapon)}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));" onerror="this.style.display='none'">
                </div>
            `;
        }

        const likesCount = b.likes || 0;
        const isLiked = b.liked === true;
        const commentsList = b.comments || [];
        const isSaved = savedList.some(s => s.id === b.id || (s.weapon === b.weapon && s.desc === b.desc));

        const jogoArma = obterJogoPorNomeArma(b.weapon);
        const logoJogo = obterLogoJogo(jogoArma);

        let commentsHtml = commentsList.map(c => `
            <div style="padding: 0.5rem; background: rgba(0,0,0,0.3); border-left: 2px solid var(--accent); border-radius: 4px; margin-bottom: 0.4rem; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <strong style="color: var(--accent);">${escapeHTML(c.author)}</strong>
                    <span style="color: #6b7280; font-size: 0.72rem;">${c.time || "Agora"}</span>
                </div>
                <span style="color: #d1d5db; word-break: break-word;">${escapeHTML(c.text)}</span>
            </div>
        `).join("");

        if (!commentsHtml) {
            commentsHtml = `<p style="color: #6b7280; font-size: 0.8rem; text-align: center; margin: 0.5rem 0;">Nenhum comentário ainda. Seja o primeiro!</p>`;
        }

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tag">Por: ${escapeHTML(b.author)}</span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}"
                    style="height: 40px; max-width: 80px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));" 
                    onerror="this.style.display='none'"
                >
            </div>
            ${imgHtml}
            <h3 style="margin-top: 0.4rem;">${escapeHTML(b.weapon)}</h3>
            <div class="acessorios" style="margin-top: 0.5rem;">
                <p style="font-size: 0.85rem; line-height: 1.4;">${escapeHTML(b.desc)}</p>
            </div>
            
            ${b.code ? `<button class="btn-copy" onclick="copyCode(${jsArg(b.code)})" style="margin: 0.8rem 0 0.5rem 0;">📋 Copiar Código (${escapeHTML(b.code)})</button>` : ""}

            <div style="display: flex; gap: 0.4rem; margin-top: 0.8rem; border-top: 1px solid #232a35; padding-top: 0.8rem;">
                <button 
                    onclick="alternarCurtida(${jsArg(b.id)})"
                    id="btn-like-${b.id}"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: ${isLiked ? 'rgba(239, 68, 68, 0.2)' : '#1a1d26'}; border: 1px solid ${isLiked ? '#ef4444' : '#2e3545'}; color: ${isLiked ? '#ef4444' : '#fff'}; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    ${isLiked ? '❤️' : '🤍'} <span>${likesCount}</span>
                </button>
                <button 
                    onclick="toggleAreaComentarios(${jsArg(b.id)})"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: #1a1d26; border: 1px solid #2e3545; color: #fff; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    💬 <span>${commentsList.length}</span>
                </button>
                <button 
                    onclick="alternarSalvarClasse(${jsArg(b.id)})"
                    id="btn-save-${b.id}"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: ${isSaved ? 'var(--accent)' : '#1a1d26'}; border: 1px solid ${isSaved ? 'var(--accent)' : '#2e3545'}; color: ${isSaved ? '#000' : '#fff'}; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    ${isSaved ? '★ Salvo' : '☆ Salvar'}
                </button>
            </div>

            <div id="comentarios-secao-${b.id}" style="display: none; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px dashed #232a35;">
                <div id="lista-comentarios-${b.id}" style="max-height: 140px; overflow-y: auto; margin-bottom: 0.6rem; padding-right: 0.2rem;">
                    ${commentsHtml}
                </div>
                <div style="display: flex; gap: 0.4rem;">
                    <input
                        type="text"
                        id="input-comentario-${b.id}"
                        placeholder="Escreva um comentário..."
                        required
                        style="flex: 1; padding: 0.45rem 0.6rem; background: #0c0e14; border: 1px solid #232a35; border-radius: 4px; color: #fff; font-size: 0.82rem;">
                    <button
                        style="padding: 0.45rem 0.8rem; background: var(--accent); color: #000; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Enviar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function alternarSalvarClasse(buildId) {
    const logado = localStorage.getItem("wz_logged_user");
    if (!logado) { showSection(null, "login", null); return; }

    const savedList = lerJSON("wz_saved_classes", []);
    if (useFirebase && db) {
        // Busca build no Firebase por ID (documento = buildId)
        db.collection('builds').doc(buildId).get().then(doc => {
            if (!doc.exists) return;
            const b = doc.data();
            const index = savedList.findIndex(s => s.id === buildId);
            if (index !== -1) {
                savedList.splice(index, 1);
                localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
            } else {
                savedList.unshift({ id: buildId, author: b.author, weapon: b.weapon, desc: b.descricao, code: b.code, img: b.img });
                localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
            }
            loadCommunityBuilds(false);
            renderSavedClassesInProfile();
        });
        return;
    }
    // Fallback local
    const list = lerJSON("wz_community_builds", []);
    const build = list.find(b => b.id === buildId);
    if (!build) return;
    const index = savedList.findIndex(s => s.id === build.id || (s.weapon === build.weapon && s.desc === build.desc));
    if (index !== -1) {
        savedList.splice(index, 1);
        localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
    } else {
        savedList.unshift({ id: build.id, author: build.author, weapon: build.weapon, desc: build.desc, code: build.code, img: build.img });
        localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
    }
    loadCommunityBuilds(false);
    renderSavedClassesInProfile();
}

function alternarCurtida(buildId) {
    const logado = localStorage.getItem("wz_logged_user");
    if (!logado) { showSection(null, "login", null); return; }

    if (useFirebase && db) {
        db.collection('builds').doc(buildId).get().then(doc => {
            if (!doc.exists) return;
            const b = doc.data();
            const liked = b.liked_by && Array.isArray(b.liked_by) ? b.liked_by.includes(logado) : false;
            const newLikes = liked ? Math.max(0, (b.likes || 1) - 1) : (b.likes || 0) + 1;
            const newLikedBy = liked ? (b.liked_by || []).filter(u => u !== logado) : [...(b.liked_by || []), logado];
            db.collection('builds').doc(buildId).update({ likes: newLikes, liked_by: newLikedBy })
                .then(() => loadCommunityBuilds(false))
                .catch(err => console.warn("Erro ao curtir:", err));
        }).catch(err => console.warn("Erro ao ler build:", err));
        return;
    }

    // Fallback localStorage
    const list = lerJSON("wz_community_builds", []);
    const build = list.find(b => b.id === buildId);
    if (!build) return;
    if (build.liked) {
        build.likes = Math.max(0, (build.likes || 1) - 1);
        build.liked = false;
    } else {
        build.likes = (build.likes || 0) + 1;
        build.liked = true;
    }
    localStorage.setItem("wz_community_builds", JSON.stringify(list));
    loadCommunityBuilds(false);
}

function toggleAreaComentarios(buildId) {
    const area = document.getElementById(`comentarios-secao-${buildId}`);
    if (!area) return;
    area.style.display = (area.style.display === "none" || area.style.display === "") ? "block" : "none";
}

function adicionarComentario(event, buildId) {
    event.preventDefault();
    const logado = localStorage.getItem("wz_logged_user");
    if (!logado) { showSection(null, "login", null); return; }

    const input = document.getElementById(`input-comentario-${buildId}`);
    if (!input) return;

    const texto = input.value.trim();
    if (!texto) return;

    const autorLogado = localStorage.getItem("wz_logged_user") || "Operador";
    const profile = lerJSON("wz_user_profile", null);
    const autorFinal = (profile && profile.name) ? profile.name : autorLogado;

    const list = lerJSON("wz_community_builds", []);
    const build = list.find(b => b.id === buildId);
    // Se não achar no localStorage, ainda tenta Firestore; não bloqueia
    const commentsArr = build ? (build.comments || []) : [];
    commentsArr.push({
        author: autorFinal,
        text: texto,
        time: "Agora"
    });

    if (useFirebase && db) {
        const autorLogado = localStorage.getItem("wz_logged_user") || "Operador";
        const profile = lerJSON("wz_user_profile", null);
        const autorFinal = (profile && profile.name) ? profile.name : autorLogado;
        // Usa direto o doc com o buildId do card; se falhar, não bloqueia
        db.collection('builds').doc(buildId).get().then(doc => {
            const data = doc.exists ? doc.data() : {};
            const arr = Array.isArray(data.comments) ? [...data.comments] : [];
            arr.push({ author: autorFinal, text: texto, time: "Agora" });
            const ref = doc.exists ? doc.ref : db.collection('builds').doc(buildId);
            ref.update({ comments: arr })
                .then(() => loadCommunityBuilds(false))
                .catch(err => console.warn("Erro ao atualizar:", err));
        }).catch(err => console.warn("Erro ao ler doc:", err));
        input.value = "";
        const area = document.getElementById(`comentarios-secao-${buildId}`);
        if (area) area.style.display = "block";
        return;
    }

    localStorage.setItem("wz_community_builds", JSON.stringify(list));
    input.value = "";
    loadCommunityBuilds(false);

    const area = document.getElementById(`comentarios-secao-${buildId}`);
    if (area) area.style.display = "block";
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert("Código de build copiado: " + code);
    }).catch(err => console.error("Erro ao copiar código:", err));
}

// ========================================================
//  7. RENDERIZAÇÃO DE CLASSES SALVAS NO PERFIL            |
// ========================================================
function renderSavedClassesInProfile() {
    const container = document.getElementById("profileSavedCards");
    const countTag = document.getElementById("profileSavedCountTag");
    if (!container) return;

    const savedList = lerJSON("wz_saved_classes", []);

    if (countTag) {
        countTag.textContent = `${savedList.length} ${savedList.length === 1 ? 'salva' : 'salvas'}`;
    }

    container.innerHTML = "";

    if (savedList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #8c8ea3; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px dashed #2a2e3d;">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #fff;">Nenhuma classe salva ainda</p>
                <small>Quando você gostar de uma build na Comunidade, clique em <strong>Salvar</strong> para guardar aqui.</small>
            </div>
        `;
        return;
    }

    savedList.forEach(s => {
        const card = document.createElement("div");
        card.className = "card";

        let imgHtml = "";
        if (s.img) {
            imgHtml = `
                <div style="width: 100%; height: 90px; display: flex; align-items: center; justify-content: center; margin: 0.4rem 0;">
                    <img src="${ASSETS_CDN + s.img}" alt="${escapeHTML(s.weapon)}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));" onerror="this.style.display='none'">
                </div>
            `;
        }

        const nomeArmaLimpo = (s.weapon || "").split("(")[0].trim();
        const jogoArma = obterJogoPorNomeArma(s.weapon);
        const logoJogo = obterLogoJogo(jogoArma);

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tag">Autor: ${escapeHTML(s.author)}</span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}"
                    style="height: 40px; max-width: 80px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));" 
                    onerror="this.style.display='none'"
                >
            </div>
            ${imgHtml}
            <h3 style="margin-top: 0.4rem;">${escapeHTML(s.weapon)}</h3>
            <div class="acessorios" style="margin-top: 0.5rem;">
                <p style="font-size: 0.85rem; line-height: 1.4;">${escapeHTML(s.desc)}</p>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.8rem;">
                <button 
                    onclick="abrirNoArmeiro(${jsArg(nomeArmaLimpo)})"
                    style="flex: 1; padding: 0.55rem; background: var(--accent); color: #000; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    ⚙️ Armeiro
                </button>
                <button 
                    onclick="removerClasseSalva(${jsArg(s.id)})"
                    style="padding: 0.55rem 0.8rem; background: #2a2e3d; color: #ef4444; border: 1px solid #3f4458; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function removerClasseSalva(savedId) {
    let savedList = lerJSON("wz_saved_classes", []);
    savedList = savedList.filter(s => s.id !== savedId);
    localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));

    renderSavedClassesInProfile();
    loadCommunityBuilds(false);
}

// ========================================================
//  8. TEMAS & PARTÍCULAS (TSPARTICLES)                    |
// ========================================================
function setTheme(theme) {
    if (theme === 'green') theme = 'mw4';
    if (theme === 'red') theme = 'mw3';
    if (theme === 'blue') theme = 'bo6';

    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("wz_theme", theme);
    
    document.querySelectorAll(".theme-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(`.theme-${theme}`).forEach(btn => btn.classList.add("active"));

    const video = document.getElementById("bgVideo");
    if (video && themeVideos[theme]) {
        const target = themeVideos[theme];
        if (!video.src.includes(target)) {
            video.style.opacity = "0.2";
            setTimeout(() => {
                video.src = target;
                video.load();
                video.play().then(() => video.style.opacity = "0.70")
                           .catch(() => video.style.opacity = "0.70");
            }, 200);
        }
    }

    initParticles(theme);
}

function initParticles(theme = "mw4") {
    const colors = themeParticleColors[theme] || themeParticleColors.mw4;
    tsParticles.load("tsparticles", {
        background: { color: { value: "transparent" } },
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: colors },
            shape: { type: "circle" },
            opacity: {
                value: { min: 0.35, max: 0.9 },
                random: true,
                animation: { enable: true, speed: 1.8, sync: false }
            },
            size: { value: { min: 1.5, max: 3.5 }, random: true },
            move: {
                enable: true,
                speed: 4,
                direction: "top-right",
                random: true,
                straight: false,
                outModes: { default: "out" }
            }
        },
        interactivity: { events: { onHover: { enable: false } } },
        detectRetina: true
    });
}

// ========================================================
//  9. NAVEGAÇÃO & MENU MOBILE                             |
// ========================================================
function toggleMobileMenu() {
    document.getElementById("navbarBottom").classList.toggle("active");
    document.getElementById("mobileMenuBtn").classList.toggle("active");
}

function closeMobileMenu() {
    document.getElementById("navbarBottom").classList.remove("active");
    document.getElementById("mobileMenuBtn").classList.remove("active");
}

function showSection(event, sectionId, clickedElement) {
    if (event) event.preventDefault();

    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-section'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active-section');

    document.querySelectorAll('.nav-item, .login-icon').forEach(it => it.classList.remove('active'));
    if (clickedElement) clickedElement.classList.add('active');

    if (sectionId === 'profile') {
        loadProfileData();
        renderSavedClassesInProfile();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================================
//  10. AUTENTICAÇÃO E PERFIL DO USUÁRIO                   |
// ========================================================
function loginGoogle() {
    if (!useFirebase || !auth) return alert('Firebase Auth não inicializado');
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            if (user) {
                const username = user.displayName || user.email || 'Operador';
                saveLocalProfile(username);
                loadCommunityBuilds(true);
            }
        })
        .catch((err) => alert('Erro ao logar com Google: ' + err.message));
}
function saveLocalProfile(username) {
    let profile = lerJSON("wz_user_profile", null) || {};
    profile.name = username;
    if (!profile.style) profile.style = "Rusher";
    localStorage.setItem("wz_user_profile", JSON.stringify(profile));
    localStorage.setItem("wz_logged_user", username);
    const msg = document.getElementById("loginMessage");
    msg.textContent = `Acesso liberado, ${username}!`;
    msg.style.display = "block";
    checkLoginStatus();
    setTimeout(() => {
        msg.style.display = "none";
        document.querySelector('#nav-login').click();
    }, 1500);
}
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const username = email.split('@')[0];

    if (useFirebase && auth) {
        auth.signInWithEmailAndPassword(email, password)
            .then(({ user }) => {
                saveLocalProfile(user ? (user.displayName || username) : username);
            })
            .catch(() => {
                auth.createUserWithEmailAndPassword(email, password)
                    .then(({ user }) => {
                        saveLocalProfile(user ? (user.displayName || username) : username);
                    })
                    .catch(err => alert('Erro: ' + err.message));
            });
    } else {
        saveLocalProfile(username);
    }
}

function checkLoginStatus() {
    const user = localStorage.getItem("wz_logged_user");
    const loginNav = document.getElementById("nav-login");
    const nameTag = document.getElementById("profileNameTag");
    const profile = lerJSON("wz_user_profile", null);
    
    if (user && loginNav) {
        const displayName = profile ? profile.name : user;
        loginNav.innerHTML = `<span class="avatar-letter">${escapeHTML(displayName.charAt(0).toUpperCase())}</span>`;
        loginNav.title = `Meu Perfil (${displayName})`;
        
        if (nameTag) {
            nameTag.textContent = displayName;
            nameTag.style.display = "block";
        }
        
        loginNav.onclick = function(e) {
            showSection(e, 'profile', this);
            loadProfileData(); 
            closeMobileMenu();
        };
    } else if (loginNav) {
        loginNav.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        loginNav.title = "Acessar Conta";
        if (nameTag) {
            nameTag.textContent = "";
            nameTag.style.display = "none";
        }
        loginNav.onclick = function(e) { 
            showSection(e, 'login', this); 
            closeMobileMenu();
        };
    }
}

// ========================================================
//  11. VÍNCULO ACTIVISION ID & ESTATÍSTICAS               |
// ========================================================
function vincularActivisionId() {
    const input = document.getElementById("activisionIdInput");
    const select = document.getElementById("activisionPlatformSelect");
    const statusBadge = document.getElementById("activisionStatusBadge");

    if (!input || !input.value.trim()) {
        alert("Por favor, digite seu Activision ID completo (ex: Ghost#1234567).");
        return;
    }

    const fullId = input.value.trim();
    const platform = select ? select.value : "Battle.net";

    let hashNum = 0;
    for (let i = 0; i < fullId.length; i++) {
        hashNum += fullId.charCodeAt(i);
    }

    const kdSimulado = (1.25 + ((hashNum % 135) / 100)).toFixed(2);
    const winsSimulado = 42 + (hashNum % 260);
    const matchesSimulado = winsSimulado * 7 + (hashNum % 180);
    const prestigeSimulado = 1 + (hashNum % 10);

    const statsData = {
        activisionId: fullId,
        platform: platform,
        kd: kdSimulado,
        wins: winsSimulado,
        matches: matchesSimulado,
        prestige: prestigeSimulado
    };

    localStorage.setItem("wz_activision_stats", JSON.stringify(statsData));

    exibirEstatisticasActivision(statsData);

    if (statusBadge) {
        statusBadge.textContent = "✓ CONECTADO";
        statusBadge.style.background = "#22c55e";
        statusBadge.style.color = "#000";
    }

    alert(`Activision ID ${fullId} vinculado com sucesso! Estatísticas carregadas.`);
}

function exibirEstatisticasActivision(stats) {
    const statsContainer = document.getElementById("activisionStatsContainer");
    if (!statsContainer || !stats) return;

    document.getElementById("statsPlayerTag").textContent = stats.activisionId;
    document.getElementById("statsPlayerPlatform").textContent = stats.platform;
    document.getElementById("statKd").textContent = stats.kd;
    document.getElementById("statWins").textContent = stats.wins;
    document.getElementById("statMatches").textContent = stats.matches;
    document.getElementById("statPrestige").textContent = `Nível ${stats.prestige}`;

    statsContainer.style.display = "block";
}

function loadProfileData() {
    const profile = lerJSON("wz_user_profile", null);
    const user = localStorage.getItem("wz_logged_user");
    const currentName = profile ? profile.name : (user || "Convidado");

    if (profile) {
        document.getElementById("profName").value = profile.name || "";
        document.getElementById("profStyle").value = profile.style || "Rusher";
        document.getElementById("profWeapon").value = profile.weapon || "";
        document.getElementById("profBio").value = profile.bio || "";
        document.getElementById("profileAvatar").textContent = (profile.name || "?").charAt(0).toUpperCase();
    }
    
    const nameDisplay = document.getElementById("profileUsernameDisplay");
    if (nameDisplay) nameDisplay.textContent = currentName;

    const savedStats = lerJSON("wz_activision_stats", null);
    const statusBadge = document.getElementById("activisionStatusBadge");
    const idInput = document.getElementById("activisionIdInput");
    const platSelect = document.getElementById("activisionPlatformSelect");

    if (savedStats) {
        if (idInput) idInput.value = savedStats.activisionId || "";
        if (platSelect) platSelect.value = savedStats.platform || "Battle.net";
        if (statusBadge) {
            statusBadge.textContent = "✓ CONECTADO";
            statusBadge.style.background = "#22c55e";
            statusBadge.style.color = "#000";
        }
        exibirEstatisticasActivision(savedStats);
    } else {
        if (statusBadge) {
            statusBadge.textContent = "NÃO VINCULADO";
            statusBadge.style.background = "#2a2e3d";
            statusBadge.style.color = "#8c8ea3";
        }
        const statsContainer = document.getElementById("activisionStatsContainer");
        if (statsContainer) statsContainer.style.display = "none";
    }

    renderSavedClassesInProfile();
}

function saveProfile(event) {
    event.preventDefault();
    const newName = document.getElementById("profName").value.trim();
    
    let profile = lerJSON("wz_user_profile", null) || {};
    profile.name = newName;
    profile.style = document.getElementById("profStyle").value;
    profile.weapon = document.getElementById("profWeapon").value.trim();
    profile.bio = document.getElementById("profBio").value.trim();
    
    localStorage.setItem("wz_user_profile", JSON.stringify(profile));
    localStorage.setItem("wz_logged_user", newName);
    
    document.getElementById("profileAvatar").textContent = newName.charAt(0).toUpperCase();
    const nameDisplay = document.getElementById("profileUsernameDisplay");
    if (nameDisplay) nameDisplay.textContent = newName;
    
    const msg = document.getElementById("profileMessage");
    msg.style.display = "block";
    checkLoginStatus(); 
    setTimeout(() => msg.style.display = "none", 2500);
}

function logoutUser() {
    if (confirm("Deseja sair da sua conta?")) {
        localStorage.removeItem("wz_logged_user");
        localStorage.removeItem("wz_activision_stats");
        alert("Você saiu com sucesso.");
        window.location.reload(); 
    }
}

function showRegister() {
    alert("O cadastro está em modo simulação.\nBasta preencher qualquer e-mail e senha no formulário para testar.");
}

function mudarVisualArsenal(modo) {
    localStorage.setItem("wz_arsenal_view", modo);
    document.getElementById("btnViewGrid").style.background = modo === "grid" ? "var(--accent)" : "#1a1d26";
    document.getElementById("btnViewGrid").style.color = modo === "grid" ? "#000" : "#fff";
    document.getElementById("btnViewGrid").style.borderColor = modo === "grid" ? "var(--accent)" : "#2e3545";
    document.getElementById("btnViewLista").style.background = modo === "lista" ? "var(--accent)" : "#1a1d26";
    document.getElementById("btnViewLista").style.color = modo === "lista" ? "#000" : "#fff";
    document.getElementById("btnViewLista").style.borderColor = modo === "lista" ? "var(--accent)" : "#2e3545";
    aplicarFiltrosHome();
}

// ========================================================
//  12. INICIALIZAÇÃO GERAL                                |
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("wz_theme") || "mw4";
    setTheme(savedTheme);

    const counterElement = document.getElementById("visit-count");
    let currentVisits = parseInt(localStorage.getItem("wz_visits") || "1482", 10);
    currentVisits += 1;
    localStorage.setItem("wz_visits", currentVisits);
    if (counterElement) counterElement.textContent = currentVisits.toLocaleString("pt-BR");

    carregarDadosIniciais();
    checkLoginStatus(); 

    window.addEventListener("scroll", () => {
        const navbar = document.getElementById("navbar");
        if (window.scrollY > 40) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });
});

// ========================================================
//  ARMEIRO VISUAL (bancada com nós de acessórios)         |
// ========================================================
// true  => slots indisponíveis para a arma somem do palco
// false => ficam visíveis, apagados e com cadeado
const OCULTAR_SLOTS_INDISPONIVEIS = false;

const ICONES_SLOT = {
    boca: '<rect x="3" y="9" width="11" height="6" rx="1"/><path d="M14 12h7M17 9l3-2M17 15l3 2"/>',
    cano: '<rect x="2" y="10" width="20" height="4" rx="1"/><path d="M7 10V7M12 10V7M17 10V7"/>',
    laser: '<circle cx="5" cy="12" r="2.5"/><path d="M8 12h14M11 8l-1-3M11 16l-1 3"/>',
    mira: '<circle cx="12" cy="12" r="6.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    coronha: '<path d="M3 8h10l3 2h5v8H8l-2-4H3z"/>',
    acoplamento: '<rect x="3" y="5" width="18" height="4" rx="1"/><path d="M10 9v11h4V9"/>',
    carregador: '<path d="M8 3h8v14l-2 4H8z"/><path d="M8 8h8M8 12h8"/>',
    municao: '<path d="M9 21v-9a3 3 0 0 1 6 0v9z"/><path d="M9 17h6"/>',
    gatilho: '<path d="M5 5h9v5H9v9"/><path d="M9 14c2 0 5 1 5 4"/>',
    cabo: '<path d="M8 3h8v6l3 12H10L8 9z"/>',
    kit: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    cadeado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};

// x / y em % do palco (posição de cada nó ao redor da arma)
const SLOTS_ARMEIRO = [
    { id: "slot-cano",         rotulo: "Cano",         icone: "cano",        x: 16, y: 26 },
    { id: "slot-boca",         rotulo: "Boca",         icone: "boca",        x: 13, y: 45 },
    { id: "slot-acoplamento",  rotulo: "Acoplamento",  icone: "acoplamento", x: 20, y: 66 },
    { id: "slot-laser",        rotulo: "Laser",        icone: "laser",       x: 48, y: 13 },
    { id: "slot-mira",         rotulo: "Mira",         icone: "mira",        x: 72, y: 14 },
    { id: "slot-coronha",      rotulo: "Coronha",      icone: "coronha",     x: 85, y: 40 },
    { id: "slot-cabo",         rotulo: "Cabo",         icone: "cabo",        x: 82, y: 62 },
    { id: "slot-gatilho",      rotulo: "Gatilho/Modo", icone: "gatilho",     x: 66, y: 76 },
    { id: "slot-carregador",   rotulo: "Carregador",   icone: "carregador",  x: 46, y: 88 },
    { id: "slot-municao",      rotulo: "Munição",      icone: "municao",     x: 27, y: 80 },
    { id: "slot-kit-conversao",rotulo: "Kit de Conversão", icone: "kit",     x: 85, y: 88, kit: true }
];

let slotSeletorAberto = null;

function svgSlot(nome) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES_SLOT[nome] || ""}</svg>`;
}

function construirNosArmeiro() {
    const cont = document.getElementById("armeiroNodes");
    if (!cont || cont.children.length) return;

    SLOTS_ARMEIRO.forEach(cfg => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-node" + (cfg.kit ? " slot-node-kit" : "");
        btn.dataset.slot = cfg.id;
        btn.style.setProperty("--x", cfg.x);
        btn.style.setProperty("--y", cfg.y);
        btn.innerHTML =
            `<span class="slot-node-icon">${svgSlot(cfg.icone)}</span>` +
            `<span class="slot-node-text">` +
                `<span class="slot-node-slot">${cfg.rotulo}</span>` +
                `<span class="slot-node-name"></span>` +
                `<span class="slot-node-aviso"></span>` +
            `</span>`;
        btn.addEventListener("click", () => abrirSeletorSlot(cfg.id));
        cont.appendChild(btn);
    });

    const pips = document.getElementById("armeiroPips");
    if (pips && !pips.children.length) {
        for (let i = 0; i < 5; i++) pips.appendChild(document.createElement("i"));
    }

    document.addEventListener("click", (e) => {
        if (!slotSeletorAberto) return;
        if (e.target.closest("#armeiroPicker") || e.target.closest(".slot-node")) return;
        fecharSeletorSlot();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") fecharSeletorSlot();
    });
}

function renderizarArmeiroVisual() {
    const cont = document.getElementById("armeiroNodes");
    if (!cont) return;

    let equipados = 0;

    SLOTS_ARMEIRO.forEach(cfg => {
        const sel = document.getElementById(cfg.id);
        const no = cont.querySelector(`[data-slot="${cfg.id}"]`);
        if (!sel || !no) return;

        const indisponivel = sel.getAttribute("data-indisponivel") === "true";
        const bloqueadoKit = sel.getAttribute("data-bloqueado-kit") === "true";
        const vazio = !sel.value;
        const limite = sel.disabled && !indisponivel && !bloqueadoKit && vazio;
        if (!vazio && !indisponivel && !bloqueadoKit) equipados++;

        no.classList.toggle("indisponivel", indisponivel);
        no.classList.toggle("bloqueado-kit", bloqueadoKit && !indisponivel);
        no.classList.toggle("limite", limite);
        no.classList.toggle("equipado", !vazio && !indisponivel && !bloqueadoKit);
        no.hidden = OCULTAR_SLOTS_INDISPONIVEIS && indisponivel;

        const travado = indisponivel || bloqueadoKit || limite;
        no.disabled = travado;

        const icone = no.querySelector(".slot-node-icon");
        icone.innerHTML = svgSlot(travado ? "cadeado" : cfg.icone);

        const nome = no.querySelector(".slot-node-name");
        const aviso = no.querySelector(".slot-node-aviso");
        const opt = sel.selectedOptions && sel.selectedOptions[0];
        nome.textContent = (!vazio && opt) ? opt.textContent.replace(/^★\s*/, "") : "";

        if (indisponivel) aviso.textContent = "Indisponível para esta arma";
        else if (bloqueadoKit) aviso.textContent = "Bloqueado pelo Kit";
        else if (limite) aviso.textContent = "Limite de 5 atingido";
        else aviso.textContent = "";

        no.title = aviso.textContent || (vazio ? `Escolher ${cfg.rotulo}` : `${cfg.rotulo}: ${nome.textContent}`);
    });

    document.querySelectorAll("#armeiroPips i").forEach((p, i) => p.classList.toggle("on", i < equipados));
}

function abrirSeletorSlot(slotId) {
    const sel = document.getElementById(slotId);
    const painel = document.getElementById("armeiroPicker");
    const lista = document.getElementById("armeiroPickerLista");
    const titulo = document.getElementById("armeiroPickerTitulo");
    if (!sel || !painel || !lista || sel.disabled) return;

    if (slotSeletorAberto === slotId) { fecharSeletorSlot(); return; }
    slotSeletorAberto = slotId;

    const cfg = SLOTS_ARMEIRO.find(s => s.id === slotId);
    titulo.textContent = cfg ? cfg.rotulo : "Acessório";
    lista.innerHTML = "";

    Array.from(sel.options).forEach(opt => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "picker-item" + (opt.value === sel.value ? " selecionada" : "") + (opt.value === "" ? " remover" : "");
        item.textContent = opt.value === "" ? "— Nenhum (remover) —" : opt.textContent;
        item.addEventListener("click", () => escolherOpcaoSlot(slotId, opt.value));
        lista.appendChild(item);
    });

    painel.hidden = false;
    lista.scrollTop = 0;
    const atual = lista.querySelector(".selecionada");
    if (atual) atual.scrollIntoView({ block: "nearest" });

    document.querySelectorAll(".slot-node").forEach(n => n.classList.toggle("ativo", n.dataset.slot === slotId));
}

function fecharSeletorSlot() {
    slotSeletorAberto = null;
    const painel = document.getElementById("armeiroPicker");
    if (painel) painel.hidden = true;
    document.querySelectorAll(".slot-node.ativo").forEach(n => n.classList.remove("ativo"));
}

function escolherOpcaoSlot(slotId, valor) {
    const sel = document.getElementById(slotId);
    if (!sel) return;
    sel.value = valor;
    fecharSeletorSlot();
    atualizarContadorSlots();
}
