import json
import os
import re
from playwright.sync_api import sync_playwright

ARQUIVOS_JSON = [
    "armas_bo6.json",
    "armas_bo7.json",
    "armas_mw3.json",
    "armas_mw2.json"
]

def normalizar_nome(nome):
    if not nome:
        return ""
    nome = nome.upper()
    return re.sub(r"[^A-Z0-9]", "", nome)

def obter_meta_warzone_puro():
    """
    Extrai estritamente a Tier List do Warzone do WZStats dividindo 
    exatamente pelas seções: Warzone Meta (Tier S), A Tier, B Tier, C Tier e D Tier.
    """
    mapa_meta = {}
    url = "https://wzstats.gg/"

    print("🚀 Abrindo navegador...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        print(f"🌐 Conectando à página oficial de Warzone: {url}...")
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)

            # Rola a página para renderizar as seções do DOM
            print("📜 Carregando tabelas do meta de Warzone...")
            for _ in range(6):
                page.mouse.wheel(0, 1000)
                page.wait_for_timeout(600)

            # Extrai o texto limpo da página
            texto = page.inner_text("body")
            linhas = [l.strip() for l in texto.split("\n") if l.strip()]

            tier_atual = None
            
            ignorar = {
                "WARZONE", "META", "BUILDS", "GET ALL", "LONG RANGE", "CLOSE RANGE",
                "SNIPER SUPPORT", "LOADOUT", "RANKED", "RESURGENCE", "ASSAULT RIFLE",
                "SUBMACHINE", "SMG", "LMG", "MARKSMAN", "SHOTGUN", "PISTOL", "UPDATE",
                "BEST", "GUNS", "TODAY", "VIEW", "TIER", "TIER LIST", "BATTLE RIFLE",
                "MELEE", "SPECIAL", "LAUNCHER", "SNIPER"
            }

            for linha in linhas:
                l_up = linha.upper()

                # Identifica com precisão as seções de Tier do Warzone
                if l_up in ["WARZONE META", "ABSOLUTE META", "S TIER", "TIER S"]:
                    tier_atual = "Tier S"
                    continue
                elif l_up in ["A TIER", "TIER A"]:
                    tier_atual = "Tier A"
                    continue
                elif l_up in ["B TIER", "TIER B"]:
                    tier_atual = "Tier B"
                    continue
                elif l_up in ["C TIER", "TIER C"]:
                    tier_atual = "Tier C"
                    continue
                elif l_up in ["D TIER", "TIER D"]:
                    tier_atual = "Tier D"
                    continue

                if not tier_atual:
                    continue

                # Pula linhas de controle, numerações ou títulos genéricos
                if (len(linha) < 2 or 
                    linha.startswith("#") or 
                    linha.startswith("•") or 
                    "%" in linha or 
                    linha.startswith("Get all") or
                    l_up in ignorar):
                    continue

                # Se a linha não for um comando da interface, registra como arma no Tier da seção
                chave = normalizar_nome(linha)
                if chave and len(chave) >= 2 and chave not in mapa_meta:
                    mapa_meta[chave] = tier_atual

        except Exception as e:
            print(f"❌ Erro ao navegar no WZStats: {e}")
        finally:
            browser.close()

    return mapa_meta

def atualizar_arquivos_locais(mapa_meta):
    total_modificadas = 0

    for arquivo in ARQUIVOS_JSON:
        if not os.path.exists(arquivo):
            continue

        try:
            with open(arquivo, "r", encoding="utf-8") as f:
                armas = json.load(f)
        except Exception as e:
            print(f"❌ Erro ao ler {arquivo}: {e}")
            continue

        modificadas_arquivo = 0
        for arma in armas:
            chave = normalizar_nome(arma.get("nome"))
            if chave in mapa_meta:
                novo_tier = mapa_meta[chave]
                tier_antigo = arma.get("tier")

                if tier_antigo != novo_tier:
                    arma["tier"] = novo_tier
                    modificadas_arquivo += 1
                    total_modificadas += 1
                    print(f"🔄 [{arma.get('nome')}]: {tier_antigo} ➔ {novo_tier}")

        if modificadas_arquivo > 0:
            with open(arquivo, "w", encoding="utf-8") as f:
                json.dump(armas, f, indent=2, ensure_ascii=False)
            print(f"✅ {arquivo}: {modificadas_arquivo} armas atualizadas com o meta do Warzone.")
        else:
            print(f"ℹ️ {arquivo}: Nenhum Tier precisou de alteração.")

    print(f"\n🎉 Concluído! Total de armas ajustadas: {total_modificadas}")

if __name__ == "__main__":
    mapa = obter_meta_warzone_puro()
    if mapa:
        print(f"\n📊 {len(mapa)} armas mapeadas da Tier List de Warzone!")
        
        # Exibe as armas detectadas no Tier S e Tier A para confirmação
        tier_s_list = [k for k, v in mapa.items() if v == "Tier S"]
        tier_a_list = [k for k, v in mapa.items() if v == "Tier A"]
        print(f"⭐ Tier S ({len(tier_s_list)} armas): {', '.join(tier_s_list[:8])}...")
        print(f"🔥 Tier A ({len(tier_a_list)} armas): {', '.join(tier_a_list[:8])}...")

        print("\n⚙️ Atualizando arquivos JSON locais...")
        atualizar_arquivos_locais(mapa)
    else:
        print("❌ Nenhuma arma foi encontrada na página do Warzone.")