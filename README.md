# MetaZone — Documentação do Site

## 1. Visão Geral
Site para acompanhamento de meta de armas do jogo warzone, com lista dinâmica, banners, tema visual e integração com Firebase.

## 2. Tecnologias
- HTML5, CSS3, JavaScript (vanilla, CommonJS)
- Firebase (Firestore / Auth simulado)
- Playwright / Puppeteer (automação de testes/scraping)
- JSON como fonte de dados (armas_bo6.json, armas_bo7.json, armas_mw2.json, armas_mw3.json, acessorios.json)

## 3. Arquitetura de Arquivos
| Arquivo | Função |
|---|---|
| index.html | Página principal, estrutura do site |
| style.css | Estilos, responsividade e temas |
| script.js | Lógica de renderização, filtros e interação |
| armas_bo6.json / bo7.json / mw2.json / mw3.json | Dados das armas |
| acessorios.json | Acessórios e perks |
| bot_atualiza.js | Bot de atualização (Firebase/automação) |
| firebase-config.js / firebase.json | Configuração do Firebase |

## 4. Funcionalidades Principais
- Seletor de tema (jogo): MW4, MW3, BO6, BO7
- Menu mobile lateral
- Banner dinâmico (slider) com arma meta
- Filtros por jogo, classe e busca por nome
- Visualização em lista (mobile) / grid (desktop)
- Card de arma com tier, tipo, imagem, logo e botões de ação (Armeiro / Comunidade)
- Seção de comunidade com comentários e builds
- Seção de armeiro visual com slots de acessórios

## 5. Responsividade
- Menu fixo com backdrop blur
- Mobile: lista simplificada (nome + tipo + logo + botão), grid oculto, botões compactos
- Ajustes de padding e fontes em `@media (max-width: 800px)`

## 6. Temas
Variáveis CSS definidas para cada jogo (accent, accent-dim) aplicadas a botões, borders e badges.
