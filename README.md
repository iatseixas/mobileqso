# QSO Logbook

PWA oficial do projeto **QSO Logbook — Livro de Contatos**.

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
- `icons/` — identidade oficial QSO Logbook para PWA/iOS.
- Publicação no GitHub Pages pelo fluxo automático configurado no repositório.

## Instalação

Após a publicação no GitHub Pages, abra a URL HTTPS do projeto e use **Instalar aplicativo / Adicionar à tela inicial**. No iPhone/iPad use **Compartilhar → Adicionar à Tela de Início**.

## Dados locais

QSOs, favoritos, rádios, ajustes e alterações dos databanks permanecem no dispositivo via IndexedDB. Atualizações do PWA não devem apagar esses dados.

## Identidade atual

- Nome oficial: **QSO Logbook**.
- Cabeçalho em uma linha.
- Totem superior: **PP5KHZ**.
- Contador de indicativos lido dinamicamente da `HAM_DB`, com flash visual a cada atualização.


## Fonte principal e sincronização

A fonte principal é `iatseixas/mobileqso`, branch `main`. O arquivo canônico é `index.html`. O Google Drive recebe cópias idênticas dos commits aprovados, conforme [QSOs-REGRAS.md](QSOs-REGRAS.md). Datas de upload não definem precedência nem aprovação.

Os publicadores exigem um clone do repositório correto, na branch `main`, com o histórico alinhado a `origin/main`. Execute-os após preparar as alterações nesse clone. Eles publicam no GitHub; o espelhamento no Drive segue as regras acima.

O arquivo `pages.yml` existente apenas no Drive é um extra legado, fora do conjunto espelhado. A publicação atual usa o fluxo automático do Pages configurado no GitHub.
