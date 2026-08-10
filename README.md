# Produtividade

App pessoal de gestão de atividades — simples, direto, sem tela de login.

- **Captura rápida**: escreva o que virou demanda e ele entra direto na
  coluna "Inbox" pra você lembrar de executar depois.
- **Kanban**: arraste as tarefas entre colunas (funciona com mouse e touch).
  Colunas são editáveis, incluindo marcar quais "contam como concluída".
- **Filtro por dia**: filtra o quadro pelas tarefas com vencimento numa data
  específica.
- **Aba Produtividade**: mostra quantas tarefas você concluiu por dia, com
  resumo e média do período (7/14/30 dias).
- **Notificações**: avisa quando uma tarefa chegar na hora do vencimento ou
  ficar atrasada (enquanto o navegador estiver aberto/em segundo plano —
  não funciona com o navegador totalmente fechado).
- **Sincroniza em qualquer navegador**: os dados ficam no Firestore, então
  abrindo o link em outro computador ou celular tudo aparece igual.

## Uso

Abra `index.html` (ou o link do GitHub Pages) em qualquer navegador. Não
tem cadastro nem login — é uma ferramenta pessoal, protegida só por quem
tem o link.

## Publicar (GitHub Pages)

Settings → Pages → Deploy from a branch → `main` / `/ (root)`. A URL fica
`https://thiagojoc.github.io/Produtividade/`.

## Firestore

Usa o mesmo projeto Firebase do restante das ferramentas do Thiago,
coleção própria (`atividades_app/main`), sem exigir autenticação. A regra
de segurança correspondente já está publicada no Firebase Console desse
projeto.
