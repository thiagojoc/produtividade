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
  ficar atrasada. Funciona de dois jeitos, um em cima do outro:
  - Com a aba aberta, o próprio navegador avisa na hora (checagem local a
    cada 30s).
  - Mesmo com o app fechado em todo lugar (computador desligado, celular
    sem o navegador aberto), um agendamento no GitHub Actions
    (`.github/workflows/check-tasks.yml`) roda a cada 10 minutos, verifica
    o Firestore e manda o aviso por push (Firebase Cloud Messaging) pros
    aparelhos que já ativaram notificação alguma vez. Sem custo: usa só o
    plano gratuito do Firebase (Spark) e a cota gratuita do GitHub Actions.
    Ver "Configuração das notificações por push" mais abaixo.
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
coleção própria (`atividades_app/main`). A regra de segurança
correspondente já está publicada no Firebase Console desse projeto
(`firestore.rules`).

## Configuração das notificações por push

O código já está pronto, mas faltam dois passos manuais no console do
Firebase e no GitHub que só quem tem acesso à conta consegue fazer (sem
eles, o app continua funcionando normal, só a notificação com o app
fechado que não sai):

1. **Chave pública (VAPID) do Cloud Messaging**: no
   [Firebase Console](https://console.firebase.google.com/), projeto
   `flowbody-30162` → ⚙️ Project Settings → aba "Cloud Messaging" → seção
   "Web Push certificates" → "Generate key pair". Copiar a chave gerada e
   colar em `index.html`, na constante `VAPID_KEY` (procurar por
   `COLE_AQUI_A_CHAVE_PUBLICA_VAPID_DO_FIREBASE`). É uma chave pública, não
   tem problema ela ficar no código.

2. **Credencial de serviço, pro GitHub Actions poder ler o Firestore e
   mandar o push**: no mesmo Project Settings → aba "Service accounts" →
   "Generate new private key". Isso baixa um arquivo `.json`. Esse arquivo
   é sensível (dá acesso total ao projeto Firebase), nunca deve ser
   commitado. No GitHub, ir em Settings → Secrets and variables → Actions
   → "New repository secret", nome `FIREBASE_SERVICE_ACCOUNT`, colar o
   conteúdo inteiro do `.json` como valor.

Depois disso, é só abrir o app, clicar em "Ativar" no aviso de
notificações (ou no sininho do topo) uma vez em cada aparelho/navegador
que deve receber os avisos. No iPhone, o push só funciona com o app
instalado na tela de início (Safari → Compartilhar → "Adicionar à Tela de
Início"), não funciona só com uma aba do Safari aberta.
