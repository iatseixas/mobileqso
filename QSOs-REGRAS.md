# QSOs - REGRAS OPERACIONAIS

## Fonte principal
- A fonte principal do QSO Logbook mobile/PWA é o repositório https://github.com/iatseixas/mobileqso, branch main.
- O arquivo canônico da aplicação é index.html na raiz desse repositório.
- O Google Drive recebe cópias idênticas das versões aprovadas no GitHub, em 12 - APLICATIVOS / QSOs.
- Data de upload, nome de pasta e número de versão isolados não comprovam aprovação nem precedência.
- Registrar o SHA completo do commit aprovado antes de sincronizar. Não tratar automaticamente todo commit em main como homologado.

## Cópias existentes no Drive
- QSOs/QSO-Logbook.html e QSOs/index.html são cópias de compatibilidade do index.html canônico, sem edição independente.
- QSOs/QSO-Logbook-PWA-v2.6 é o destino existente do pacote PWA. Preservar a pasta e os IDs; não criar uma pasta por versão.
- Copiar o pacote do mesmo commit aprovado: index.html, manifest.webmanifest, sw.js, icons/, README.md, .nojekyll e scripts de publicação existentes.
- QSOs-REGRAS.md deve ser versionado no GitHub e espelhado no mesmo arquivo/ID já existente no Drive.
- QSOs-Mobile-Homologacao.html deixa de ser a referência mobile/PWA; não recriá-lo como versão concorrente.
- QSOs-V2.9.78.html é o arquivo desktop separado e fica fora deste espelhamento mobile/PWA até uma migração explicitamente solicitada.

## Processo obrigatório
1. Partir da versão atual do GitHub e preparar alterações no repositório.
2. Validar e registrar a aprovação do commit que será distribuído.
3. Obter todos os arquivos desse SHA, sem misturar commits.
4. Comparar os hashes antes da cópia; não regravar arquivos já idênticos.
5. Atualizar somente os destinos mapeados, preservando seus IDs e permissões.
6. Ler novamente os arquivos atualizados e verificar igualdade de bytes/hashes.
7. Registrar commit, caminhos, IDs, hashes e resultado da sincronização. Se houver falha, marcar a sincronização como incompleta.
8. Se a fonte ou um destino mudar durante a operação, interromper a substituição desse item e comparar novamente.

## Preservação
- Não editar diretamente cópias do Drive nem enviá-las de volta ao GitHub como fonte.
- Não apagar dados locais do usuário, IndexedDB, QSOs, favoritos ou configurações.
- Não alterar layout, logo, databanks ou funcionalidades em uma sincronização.
- Não criar versões paralelas, ZIPs ou novos HTML por versão sem solicitação.
- Manter a versão visível dentro do aplicativo.
- Arquivos extras no Drive devem ser identificados fora do conjunto espelhado; não apagá-los automaticamente.

## Rodada
- A quantidade de participantes é dinâmica e não possui limite operacional fixo.
- A ordem permanece cíclica: depois do último participante, **Próximo** devolve automaticamente a palavra ao primeiro e inicia um novo ciclo.
- **Pular** e **Ausente** mantêm o participante pendente para **Retornar**; esses estados não impedem o ciclo dos demais.
- Cada alteração da rodada ativa deve ser persistida, inclusive inclusão, reordenação, troca da vez, retorno e remoção.
- **Rodada e Livro de QSO direto são registros independentes.** Participantes de uma Rodada permanecem somente na store/histórico da própria Rodada e não criam QSOs individuais no Livro.
- Registros que tenham sido gerados automaticamente por uma Rodada devem ser removidos do Livro sem alterar QSOs diretos criados pelo operador.
- Encerrar a rodada salva o histórico e remove o estado ativo na mesma transação.
- Excluir uma rodada apaga somente o histórico dessa Rodada.
- Cada Rodada encerrada ou ativa deve disponibilizar **RELATÓRIO A4 / PDF**, com lista ordenada dos participantes, dados operacionais, tempos e margens estreitas para impressão.
