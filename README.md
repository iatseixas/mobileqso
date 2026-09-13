# QSO MOBILE

PWA oficial do projeto **QSO MOBILE — Livro de Contatos**.

## Recursos

- Busca offline em databank de radioamadores.
- Livro de contatos/QSOs com armazenamento local (IndexedDB).
- Frequências-base, repetidoras e modelos de rádio.
- Rodada com controle de participantes e histórico.
- Databanks locais com visualização, edição e Excel de retroalimentação.
- Backup e restauração dos dados pessoais.
- Instalação como PWA em Android, iOS/iPadOS e desktop.
- Funcionamento offline após o primeiro carregamento.

## Estrutura PWA

- `index.html` — aplicação completa e databanks locais.
- `manifest.webmanifest` — manifesto instalável.
- `sw.js` — cache/offline e atualização do app shell.
- `icons/` — identidade oficial QSO MOBILE para PWA/iOS.
- `.github/workflows/pages.yml` — publicação no GitHub Pages.

## Instalação

Após a publicação no GitHub Pages, abra a URL HTTPS do projeto e use **Instalar aplicativo / Adicionar à tela inicial**. No iPhone/iPad use **Compartilhar → Adicionar à Tela de Início**.

## Dados locais

QSOs, favoritos, rádios, ajustes e alterações dos databanks permanecem no dispositivo via IndexedDB. Atualizações do PWA não devem apagar esses dados.
