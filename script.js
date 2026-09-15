// ========================================================
//  1. CONFIGURAÇÃO DE ASSETS & CDN DO GITHUB              |
// ========================================================
const USUARIO_GITHUB = "TH14GO-jinx";
const ASSETS_CDN = `https://cdn.jsdelivr.net/gh/${USUARIO_GITHUB}/warzone-assets@main/`;

// Armazenamento em memória dos dados dos arquivos JSON
let listaMetaArmas = [];
let acessoriosGlobais = {};

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
        "BO6": "logos/bo7-logo.svg",
        "BO7": "logos/bo7-logo.svg"
    };
    return mapaLogos[jogo] || "logos/cod-logo.svg";
}

// Mapeamento de Kits de Conversão Aftermarket oficiais
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

// Mapeamento de slots bloqueados pelo Kit de Conversão
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

// Mapeamento de vídeos de fundo por tema
const themeVideos = {
    mw4: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/mw2.webm",
    mw3: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/mw3.webm",
    bo6: "https://pub-dc0d4c618f8f4c25b750f2d586285321.r2.dev/bo6.webm"
};

// Mapeamento de partículas por tema
const themeParticleColors = {
    mw4: ["#4ade80", "#22c55e", "#86efac", "#16a34a", "#ffffff"],
    mw3: ["#ef4444", "#dc2626", "#f87171", "#b91c1c", "#ff9999"],
    bo6: ["#ff5500", "#ff6a00", "#ff7700", "#ff8c00", "#ffa600"]
};

// ========================================================
//  2. IDENTIFICADORES DE JOGO E CLASSE DE ARMA            |
// ========================================================
function obterJogoDaArma(arma) {
    if (arma && arma.jogo) return arma.jogo.toUpperCase();

    const nome = (arma.nome || "").toUpperCase();

    // Black Ops 6
    const bo6Armas = [
        "AMES 85", "XM4", "JACKAL PDW", "C9", "KSV", "LR 7.62", "XMG", 
        "AS VAL", "GPR 91", "MODEL L", "KRIG C", "GOBLIN MK 2", "KOMPAKT 92", 
        "TANTO .22", "PP-919", "SAUG", "MARINE SP", "ASG-89", "PU-21", "GPMG-7", 
        "SWAT 5.56", "AEK-973", "DM-10", "TSARKOV 7.62", "ESSEX MODEL 07", 
        "LW3A1 FROSTLINE", "SVD", "9MM PM", "GREKHOVA", "GS45", "SIRIN 9MM", 
        "CIGMA 2B", "HE-1", "KNIFE"
    ];
    if (bo6Armas.some(w => nome.includes(w))) return "BO6";

    // Black Ops 7
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

    // Modern Warfare 2
    const mw2Armas = [
        "KASTOV 762", "M4", "LACHMANN SUB", "VEL 46", "TAQ-56", "M13B", 
        "ISO HEMLOCK", "CHIMERA", "VAZNEV-9K", "FSS HURRICANE", "RPK", 
        "LOCKWOOD 300", "LOCKWOOD MK2", "KV BROADSIDE", "FJX IMPERIUM", 
        "MCPR-300", "SIGNAL 50", "VICTUS XMR", "SP-R 208", "SA-B 50", 
        "LACHMANN-556", "STB 556", "FTAC SIEGE", "50 GS"
    ];
    if (mw2Armas.some(w => nome.includes(w))) return "MW2";

    // Padrão MW3
    return "MW3";
}

// 🎯 Padronizado com SMT e ML
function obterClasseDaArma(arma) {
    const tipo = (arma.tipo || "").toLowerCase().trim();
    const nome = (arma.nome || "").toUpperCase().trim();

    // 1. ESPINGARDAS
    if (tipo.includes("espingarda") || tipo.includes("shotgun")) return "Espingardas";
    const shotgunNomes = [
        "LOCKWOOD", "HAYMAKER", "AKITA", "MARINE SP", "ASG-89", "ECHO 12",
        "M10 BREACHER", "MAELSTROM", "OLYMPIA", "SG-12", "RECLAIMER 18",
        "KV BROADSIDE", "BRYSON", "RIVETER", "EXPEDITE 12", "MX GUARDIAN"
    ];
    if (shotgunNomes.some(w => nome.includes(w))) return "Espingardas";

    // 2. SMT (Submetralhadoras) - Checado antes de ML
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

    // 3. FUZIS DE PRECISÃO (Snipers - Hawker e M34 Novaline)
    if (tipo.includes("precisão") || tipo.includes("precisao") || tipo.includes("sniper")) return "Fuzis de Precisão";
    const sniperNomes = [
        "HAWKER-HX", "HAWKER", "M34 NOVALINE", "NOVALINE", "XRK STALKER", "MORS",
        "KATT-AMR", "LONGBOW", "KV INHIBITOR", "LR 7.62", "LW3A1 FROSTLINE", "SVD",
        "MCPR-300", "SIGNAL 50", "VICTUS XMR", "SP-X 80", "LA-B 330", "CARRACK .300",
        "FJX IMPERIUM", "AMR MOD 4", "HDR", "SHADOW SK", "STRIDER-300", "XR-3 ION"
    ];
    if (sniperNomes.some(w => nome.includes(w))) return "Fuzis de Precisão";

    // 4. FUZIS DE ATIRADOR (Marksman)
    if (tipo.includes("atirador") || tipo.includes("marksman")) return "Fuzis de Atirador";
    const atiradorNomes = [
        "KAR98K", "MK35-ISR", "VS-RECON", "DS20-MIRAGE", "SWAT 5.56", "AEK-973",
        "DM-10", "TSARKOV 7.62", "ESSEX MODEL 07", "LOCKWOOD MK2", "SP-R 208",
        "SA-B 50", "TEMPUS TORRENT", "EBR-14", "LM-S", "DM56", "MTZ INTERCEPTOR",
        "MCW 6.8", "KVD ENFORCER", "WARDEN 308", "CROSSBOW", "TAQ-M"
    ];
    if (atiradorNomes.some(w => nome.includes(w))) return "Fuzis de Atirador";

    // 5. ML (Metralhadoras Leves) - Bloqueio estrito para nunca capturar SMT
    if ((tipo.includes("ml") || tipo.includes("lmg") || tipo.includes("metralhadora") || tipo.includes("leve")) && !tipo.includes("sub") && !tipo.includes("smt")) return "ML";
    const lmgNomes = [
        "DG-58 LSW", "PULEMYOT", "BRUEN MK9", "XMG", "XM325", "PU-21", "GPMG-7",
        "FENG 82", "MK78", "PML-556", "RPK", "SAKIN MG38", "RAAL MG", "RAPP H",
        "HCR 56", "HOLGER 26", "TAQ ERADICATOR", "TAQ EVOLVERE", "KASTOV LSW", "556 ICARUS"
    ];
    if (lmgNomes.some(w => nome.includes(w))) return "ML";

    // 6. FUZIS DE BATALHA
    if (tipo.includes("batalha") || tipo.includes("battle") || tipo === "br") return "Fuzis de Batalha";
    const battleRifles = [
        "BAS-B", "SIDEWINDER", "MTZ-762", "SOA SUBVERTER", "DTIR 30-06",
        "LACHMANN-762", "FTAC RECON", "SO-14", "TAQ-V", "CRONEN SQUALL", "CBRS-3"
    ];
    if (battleRifles.some(w => nome.includes(w))) return "Fuzis de Batalha";

    // 7. PISTOLAS (VX-Compact removida para seguir a categoria do JSON)
    if (tipo.includes("pistola") || tipo.includes("handgun")) return "Pistolas";
    const pistolaNomes = [
        "RENETTI", "COR-45", "CODA 9", "9MM PM", "GREKHOVA", "GS45",
        "SIRIN 9MM", "1911", "GRAVEMARK .357", "GREMLIN", "J-GER 45", "STRYDER 22",
        "FTAC SIEGE", "50 GS", "TYR", "WSP STINGER", "X12", "X13 AUTO", "P890",
        "BASILISK", "9MM DAEMON", "GS MAGNA"
    ];
    if (pistolaNomes.some(w => nome.includes(w))) return "Pistolas";

    // 8. FUZIS DE ASSALTO (Padrão)
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
        const [resBO6, resBO7, resMW2, resMW3, resAcessorios] = await Promise.all([
            fetch("./armas_bo6.json"),
            fetch("./armas_bo7.json"),
            fetch("./armas_mw2.json"),
            fetch("./armas_mw3.json"),
            fetch("./acessorios.json")
        ]);

        if (resBO6.ok && resBO7.ok && resMW2.ok && resMW3.ok) {
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
            const [resArmas, resAcessorios] = await Promise.all([
                fetch("./armas.json"),
                fetch("./acessorios.json")
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

    aplicarFiltrosHome();
    inicializarArmeiro();
    inicializarBuildsComunidadePadrao();
    loadCommunityBuilds(true);
}

// ========================================================
//  4. BUSCA, FILTROS & CATÁLOGO NA TELA INICIAL (HOME)    |
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

function aplicarFiltrosHome() {
    const armasFiltradas = listaMetaArmas.filter(arma => {
        const matchJogo = (filtroHomeJogo === "TODOS" || obterJogoDaArma(arma) === filtroHomeJogo);
        const matchClasse = (filtroHomeClasse === "TODAS" || obterClasseDaArma(arma) === filtroHomeClasse);
        const matchBusca = !termoBuscaHome || (arma.nome && arma.nome.toLowerCase().includes(termoBuscaHome));
        return matchJogo && matchClasse && matchBusca;
    });

    renderMetaCards(armasFiltradas);
}

function renderMetaCards(armas) {
    const container = document.querySelector("#home .grid-armas");
    if (!container) return;
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

    armas.forEach(arma => {
        const card = document.createElement("div");
        card.className = "card";

        const tierClass = (arma.tier || "Tier S").toLowerCase().replace(/\s+/g, "-");
        const jogoArma = obterJogoDaArma(arma);
        const logoJogo = obterLogoJogo(jogoArma);

        card.innerHTML = `
            <!-- CABEÇALHO DO CARD -->
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tier ${tierClass}">${arma.tier || "Tier S"}</span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}" 
                    style="height: 20px; max-width: 55px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));"
                    onerror="this.style.display='none'"
                >
            </div>

            <div style="width: 100%; height: 115px; display: flex; align-items: center; justify-content: center; margin: 0.5rem 0;">
                <img 
                    src="${ASSETS_CDN + arma.arquivo_imagem}" 
                    alt="${arma.nome}" 
                    style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            </div>

            <h3>${arma.nome}</h3>
            <p class="tipo">${arma.tipo || "Arma Meta"}</p>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.8rem;">
                <button 
                    class="btn-submit" 
                    onclick="abrirNoArmeiro('${arma.nome}')" 
                    style="flex: 1; padding: 0.65rem 0.3rem; font-weight: bold; background: var(--accent); color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; text-align: center;">
                    ⚙️ Armeiro
                </button>
                <button 
                    class="btn-submit" 
                    onclick="abrirNaComunidade('${arma.nome}')" 
                    style="flex: 1; padding: 0.65rem 0.3rem; font-weight: bold; background: #2a2e3d; color: #fff; border: 1px solid #3f4458; border-radius: 4px; cursor: pointer; font-size: 0.8rem; text-align: center;">
                    👥 Comunidade
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
                        const optExiste = Array.from(selElement.options).some(o => o.value === acc.nome || o.textContent.includes(acc.nome));
                        if (!optExiste) {
                            const newOpt = document.createElement("option");
                            newOpt.value = acc.nome;
                            newOpt.textContent = acc.nome;
                            selElement.appendChild(newOpt);
                        }
                        selElement.value = acc.nome;
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
    popularSelectArmas();
}

// 🎯 Renderiza na bancada exclusivamente o ícone do jogo
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

    // Apenas o logo oficial é renderizado
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

function carregarAcessoriosNosSlots(arma) {
    const jogoArma = obterJogoDaArma(arma);
    const pool = obterPoolDoJogo(jogoArma);
    const exclusivos = arma.acessorios_exclusivos || {};

    // 1. Boca
    preencherSelectSimples(document.getElementById("slot-boca"), pool.bocas || ["Nenhum"]);

    // 2. Cano
    const canos = exclusivos.cano && exclusivos.cano.length > 0 
        ? ["Nenhum", ...exclusivos.cano] 
        : ["Nenhum", `Cano Padrão ${arma.nome}`];
    preencherSelectSimples(document.getElementById("slot-cano"), canos);

    // 3. Laser
    preencherSelectSimples(document.getElementById("slot-laser"), pool.lasers || ["Nenhum"]);

    // 4. Mira
    preencherSelectSimples(document.getElementById("slot-mira"), pool.miras || ["Nenhum"]);

    // 5. Coronha
    const coronhas = exclusivos.coronha && exclusivos.coronha.length > 0 
        ? ["Nenhum", ...exclusivos.coronha] 
        : ["Nenhum", `Coronha Padrão ${arma.nome}`, "Sem Coronha"];
    preencherSelectSimples(document.getElementById("slot-coronha"), coronhas);

    // 6. Acoplamento
    preencherSelectSimples(document.getElementById("slot-acoplamento"), pool.acoplamentos || ["Nenhum"]);

    // 7. Carregador
    const carregadores = exclusivos.carregador && exclusivos.carregador.length > 0 
        ? ["Nenhum", ...exclusivos.carregador] 
        : ["Nenhum", "Carregador Padrão"];
    preencherSelectSimples(document.getElementById("slot-carregador"), carregadores);

    // 8. Munição
    preencherSelectSimples(document.getElementById("slot-municao"), pool.municoes || ["Nenhum"]);

    // 9. Gatilho / Modo de Disparo
    preencherSelectSimples(document.getElementById("slot-gatilho"), pool.modos_disparo || ["Nenhum"]);

    // 10. Cabo
    preencherSelectSimples(document.getElementById("slot-cabo"), pool.cabos || ["Nenhum"]);

    // 11. Kit de Conversão
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

// ========================================================
//  SISTEMA DE BLOQUEIO DE SLOTS POR KIT DE CONVERSÃO      |
// ========================================================
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
        if (equipados >= 5) {
            counter.style.background = "#22c55e";
            counter.style.color = "#000";
            counter.textContent = "5 / 5 Equipados (Limite Atingido)";
        } else {
            counter.style.background = "#11131b";
            counter.style.color = "#fff";
            counter.textContent = `${equipados} / 5 Equipados`;
        }
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

// 🚀 Publica diretamente na Comunidade
function publicarClasseNoMural(btn) {
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

    const code = `WZ-${arma.nome.toUpperCase().replace(/[^A-Z0-9]/g, "")}-CUSTOM`;

    const builds = JSON.parse(localStorage.getItem("wz_community_builds") || "[]");
    const novaBuild = { 
        id: `pub-${Date.now()}`,
        author, 
        weapon: `${arma.nome} (${obterJogoDaArma(arma)} - ${obterClasseDaArma(arma)})`, 
        desc, 
        code,
        img: arma.arquivo_imagem,
        likes: 0,
        liked: false,
        comments: []
    };

    builds.unshift(novaBuild);
    localStorage.setItem("wz_community_builds", JSON.stringify(builds));

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
    const dadosAtuais = localStorage.getItem("wz_community_builds");
    if (!dadosAtuais || JSON.parse(dadosAtuais).length === 0) {
        const buildsPadrao = [
            {
                id: "b1",
                author: "Ghost_BR",
                weapon: "STG44 (MW3 - Fuzis de Assalto)",
                desc: "Silenciador Quartermaster • Cano Pesado Bruen Acrux • Parada de Mão Paracord • Tambor de 50 Projéteis • JAK Glassless Optic [Foco: Longo alcance sem recuo]",
                code: "WZ-STG44-LASER",
                img: "armas/stg44.png",
                likes: 84,
                liked: false,
                comments: [
                    { author: "CapitaoPrice", text: "Essa classe tá derretendo em Rebirth Island!", time: "Há 2 horas" },
                    { author: "Soap_COD", text: "Troquei a mira pela Corio 2.5x e ficou perfeita.", time: "Há 40 min" }
                ]
            },
            {
                id: "b2",
                author: "SniperPro99",
                weapon: "Kar98k (MW3 - Fuzis de Atirador)",
                desc: "Silenciador Sonic L • Cano Prazision 762 • Mira Range 4.0x • Munição 7.92mm Alta Velocidade • Laser SL Razorhawk [Foco: Quickscope e velocidade de bala]",
                code: "WZ-KAR98K-QUICK",
                img: "armas/kar98k.png",
                likes: 142,
                liked: true,
                comments: [
                    { author: "Alex_V", text: "Hit kill na cabeça garantido até 80 metros.", time: "Ontem" }
                ]
            },
            {
                id: "b3",
                author: "TreyarchFan",
                weapon: "Jackal PDW (BO6 - SMT)",
                desc: "Quebra-chamas Compensado • Cano Longo Reinforced • Parada de Mão DR-6 • Tambor de 40 Projéteis • Coronha Dobrável CQB [Foco: Máxima mobilidade Omnimovement]",
                code: "WZ-JACKAL-OMNI",
                img: "armas/jackal-pdw.png",
                likes: 67,
                liked: false,
                comments: [
                    { author: "Viper", text: "Melhor SMT pra entrar correndo nas casas.", time: "Há 3 horas" }
                ]
            },
            {
                id: "b4",
                author: "Rusher_RJ",
                weapon: "Superi 46 (MW3 - SMT)",
                desc: "Quebra-chamas Zehmn35 • Cano Zulu OP3 Recon • Parada de Mão DR-6 • Carregador de 40 Projéteis • Coronha Rescue-9 [Foco: Strafing absurdo de rápido]",
                code: "WZ-SUPERI-SPEED",
                img: "armas/superi-46.png",
                likes: 95,
                liked: false,
                comments: [
                    { author: "Gaz_Bravo", text: "A velocidade lateral dessa classe não tem igual.", time: "Há 5 horas" }
                ]
            },
            {
                id: "b5",
                author: "Tatico_BR",
                weapon: "AN-94 (BO7 - Fuzis de Assalto)",
                desc: "Silenciador VT-7 Spiritfire • Cano Longo Pesado • Empunhadura Bruen Heavy • Tambor de 60 Projéteis • Mira Corio Eagleseye 2.5x [Foco: Hiper-rajada inicial]",
                code: "WZ-AN94-BURST",
                img: "armas/an-94.png",
                likes: 53,
                liked: false,
                comments: []
            }
        ];
        localStorage.setItem("wz_community_builds", JSON.stringify(buildsPadrao));
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

function loadCommunityBuilds(atualizarSelect = true) {
    const list = JSON.parse(localStorage.getItem("wz_community_builds") || "[]");
    const savedList = JSON.parse(localStorage.getItem("wz_saved_classes") || "[]");
    const container = document.getElementById("communityCards");
    const counterTag = document.getElementById("communityCountTag");
    if (!container) return;

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
                <small>Não há classes da comunidade para ${filtroAtual === "TODAS" ? "nenhuma arma ainda" : `a arma "${filtroAtual}"`}.</small>
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
                    <img src="${ASSETS_CDN + b.img}" alt="${b.weapon}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));" onerror="this.style.display='none'">
                </div>
            `;
        }

        const likesCount = b.likes || 0;
        const isLiked = b.liked === true;
        const commentsList = b.comments || [];
        const isSaved = savedList.some(s => s.id === b.id || (s.weapon === b.weapon && s.desc === b.desc));

        const nomeArmaLimpo = (b.weapon || "").split("(")[0].trim();
        const jogoArma = obterJogoDaArma({ nome: nomeArmaLimpo });
        const logoJogo = obterLogoJogo(jogoArma);

        let commentsHtml = commentsList.map(c => `
            <div style="padding: 0.5rem; background: rgba(0,0,0,0.3); border-left: 2px solid var(--accent); border-radius: 4px; margin-bottom: 0.4rem; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <strong style="color: var(--accent);">${c.author}</strong>
                    <span style="color: #6b7280; font-size: 0.72rem;">${c.time || "Agora"}</span>
                </div>
                <span style="color: #d1d5db; word-break: break-word;">${c.text}</span>
            </div>
        `).join("");

        if (!commentsHtml) {
            commentsHtml = `<p style="color: #6b7280; font-size: 0.8rem; text-align: center; margin: 0.5rem 0;">Nenhum comentário ainda. Seja o primeiro!</p>`;
        }

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tag">Por: ${b.author}</span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}"
                    style="height: 18px; max-width: 48px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));" 
                    onerror="this.style.display='none'"
                >
            </div>
            ${imgHtml}
            <h3 style="margin-top: 0.4rem;">${b.weapon}</h3>
            <div class="acessorios" style="margin-top: 0.5rem;">
                <p style="font-size: 0.85rem; line-height: 1.4;">${b.desc}</p>
            </div>
            
            ${b.code ? `<button class="btn-copy" onclick="copyCode('${b.code}')" style="margin: 0.8rem 0 0.5rem 0;">📋 Copiar Código (${b.code})</button>` : ""}

            <div style="display: flex; gap: 0.4rem; margin-top: 0.8rem; border-top: 1px solid #232a35; padding-top: 0.8rem;">
                <button 
                    onclick="alternarCurtida('${b.id}')"
                    id="btn-like-${b.id}"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: ${isLiked ? 'rgba(239, 68, 68, 0.2)' : '#1a1d26'}; border: 1px solid ${isLiked ? '#ef4444' : '#2e3545'}; color: ${isLiked ? '#ef4444' : '#fff'}; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    ${isLiked ? '❤️' : '🤍'} <span>${likesCount}</span>
                </button>
                <button 
                    onclick="toggleAreaComentarios('${b.id}')"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: #1a1d26; border: 1px solid #2e3545; color: #fff; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    💬 <span>${commentsList.length}</span>
                </button>
                <button 
                    onclick="alternarSalvarClasse('${b.id}')"
                    id="btn-save-${b.id}"
                    style="flex: 1; padding: 0.5rem 0.2rem; background: ${isSaved ? 'var(--accent)' : '#1a1d26'}; border: 1px solid ${isSaved ? 'var(--accent)' : '#2e3545'}; color: ${isSaved ? '#000' : '#fff'}; border-radius: 4px; font-size: 0.8rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem;">
                    ${isSaved ? '★ Salvo' : '☆ Salvar'}
                </button>
            </div>

            <div id="comentarios-secao-${b.id}" style="display: none; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px dashed #232a35;">
                <div id="lista-comentarios-${b.id}" style="max-height: 140px; overflow-y: auto; margin-bottom: 0.6rem; padding-right: 0.2rem;">
                    ${commentsHtml}
                </div>
                <form onsubmit="adicionarComentario(event, '${b.id}')" style="display: flex; gap: 0.4rem;">
                    <input 
                        type="text" 
                        id="input-comentario-${b.id}" 
                        placeholder="Escreva um comentário..." 
                        required 
                        style="flex: 1; padding: 0.45rem 0.6rem; background: #0c0e14; border: 1px solid #232a35; border-radius: 4px; color: #fff; font-size: 0.82rem;">
                    <button 
                        type="submit" 
                        style="padding: 0.45rem 0.8rem; background: var(--accent); color: #000; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Enviar
                    </button>
                </form>
            </div>
        `;
        container.appendChild(card);
    });
}

function alternarSalvarClasse(buildId) {
    const list = JSON.parse(localStorage.getItem("wz_community_builds") || "[]");
    const savedList = JSON.parse(localStorage.getItem("wz_saved_classes") || "[]");

    const build = list.find(b => b.id === buildId);
    if (!build) return;

    const index = savedList.findIndex(s => s.id === build.id || (s.weapon === build.weapon && s.desc === build.desc));

    if (index !== -1) {
        savedList.splice(index, 1);
        localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
    } else {
        savedList.unshift({
            id: build.id,
            author: build.author,
            weapon: build.weapon,
            desc: build.desc,
            code: build.code,
            img: build.img
        });
        localStorage.setItem("wz_saved_classes", JSON.stringify(savedList));
    }

    loadCommunityBuilds(false);
    renderSavedClassesInProfile();
}

function alternarCurtida(buildId) {
    const list = JSON.parse(localStorage.getItem("wz_community_builds") || "[]");
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
    const input = document.getElementById(`input-comentario-${buildId}`);
    if (!input) return;

    const texto = input.value.trim();
    if (!texto) return;

    const list = JSON.parse(localStorage.getItem("wz_community_builds") || "[]");
    const build = list.find(b => b.id === buildId);
    if (!build) return;

    if (!build.comments) build.comments = [];

    const autorLogado = localStorage.getItem("wz_logged_user") || "Operador";
    const profile = JSON.parse(localStorage.getItem("wz_user_profile"));
    const autorFinal = (profile && profile.name) ? profile.name : autorLogado;

    build.comments.push({
        author: autorFinal,
        text: texto,
        time: "Agora"
    });

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

    const savedList = JSON.parse(localStorage.getItem("wz_saved_classes") || "[]");

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
                    <img src="${ASSETS_CDN + s.img}" alt="${s.weapon}" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));" onerror="this.style.display='none'">
                </div>
            `;
        }

        const nomeArmaLimpo = (s.weapon || "").split("(")[0].trim();
        const jogoArma = obterJogoDaArma({ nome: nomeArmaLimpo });
        const logoJogo = obterLogoJogo(jogoArma);

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="tag">Autor: ${s.author}</span>
                <img 
                    src="${ASSETS_CDN + logoJogo}" 
                    alt="${jogoArma}" 
                    title="${jogoArma}"
                    style="height: 18px; max-width: 48px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));" 
                    onerror="this.style.display='none'"
                >
            </div>
            ${imgHtml}
            <h3 style="margin-top: 0.4rem;">${s.weapon}</h3>
            <div class="acessorios" style="margin-top: 0.5rem;">
                <p style="font-size: 0.85rem; line-height: 1.4;">${s.desc}</p>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.8rem;">
                <button 
                    onclick="abrirNoArmeiro('${nomeArmaLimpo}')"
                    style="flex: 1; padding: 0.55rem; background: var(--accent); color: #000; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    ⚙️ Armeiro
                </button>
                <button 
                    onclick="removerClasseSalva('${s.id}')"
                    style="padding: 0.55rem 0.8rem; background: #2a2e3d; color: #ef4444; border: 1px solid #3f4458; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function removerClasseSalva(savedId) {
    let savedList = JSON.parse(localStorage.getItem("wz_saved_classes") || "[]");
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
function handleLogin(event) {
    event.preventDefault(); 
    const email = document.getElementById("emailInput").value.trim();
    const username = email.split('@')[0]; 
    
    let profile = JSON.parse(localStorage.getItem("wz_user_profile")) || {};
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
        event.target.reset(); 
        document.querySelector('#nav-login').click(); 
    }, 1500);
}

function checkLoginStatus() {
    const user = localStorage.getItem("wz_logged_user");
    const loginNav = document.getElementById("nav-login");
    const nameTag = document.getElementById("profileNameTag");
    const profile = JSON.parse(localStorage.getItem("wz_user_profile"));
    
    if (user && loginNav) {
        const displayName = profile ? profile.name : user;
        loginNav.innerHTML = `<span class="avatar-letter">${displayName.charAt(0).toUpperCase()}</span>`;
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

function loadProfileData() {
    const profile = JSON.parse(localStorage.getItem("wz_user_profile"));
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

    renderSavedClassesInProfile();
}

function saveProfile(event) {
    event.preventDefault();
    const newName = document.getElementById("profName").value.trim();
    
    let profile = JSON.parse(localStorage.getItem("wz_user_profile")) || {};
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
        alert("Você saiu com sucesso.");
        window.location.reload(); 
    }
}

function showRegister() {
    alert("O cadastro está em modo simulação.\nBasta preencher qualquer e-mail e senha no formulário para testar.");
}

// ========================================================
//  11. INICIALIZAÇÃO GERAL                                |
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