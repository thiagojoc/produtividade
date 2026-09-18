# Produtividade

App pessoal de gestão de atividades, simples e direto.

- **Captura rápida**: escreva o que virou demanda e ele entra direto na
  coluna "Inbox" pra você lembrar de executar depois.
- **Kanban**: arraste as tarefas entre colunas (funciona com mouse e touch).
  Colunas são editáveis, incluindo marcar quais "contam como concluída".
- **Repetição personalizável**: uma tarefa semanal pode repetir num dia
  específico da semana (ou vários, tipo terça e quinta) e uma mensal pode
  repetir num dia específico do mês (ou vários).
- **Lembrete antecipado**: opção de avisar 15 ou 30 minutos antes do
  vencimento, além do aviso na hora e do aviso de atraso.
- **Filtro por dia**: filtra o quadro pelas tarefas com vencimento numa data
  específica.
- **Aba Produtividade**: mostra quantas tarefas você concluiu por dia, com
  resumo e média do período (7/14/30 dias).
- **Notificações**: mostram a urgência e a descrição da tarefa, e avisam
  quando ela estiver perto do vencimento, chegar na hora ou ficar atrasada.
  Funciona de dois jeitos, um em cima do outro:
  - Com a aba aberta, o próprio navegador avisa na hora (checagem local a
    cada 30s).
  - Mesmo com o app fechado em todo lugar (computador desligado, celular
    sem o navegador aberto), um agendamento no GitHub Actions
    (`.github/workflows/check-tasks.yml`) verifica o Firestore e manda o
    aviso por push (Firebase Cloud Messaging) pros aparelhos que já
    ativaram notificação alguma vez. Sem custo: usa só o plano gratuito do
    Firebase (Spark) e a cota gratuita do GitHub Actions. Ver
    "Configuração das notificações por push" mais abaixo, incluindo o
    porquê de precisar de um "empurrão" externo (cron-job.org) pra rodar
    na hora certa.
- **Sincroniza em qualquer navegador**: os dados ficam no Firestore, então
  abrindo o link em outro computador ou celular tudo aparece igual.

## Uso

Abra `index.html` (ou o link do GitHub Pages) em qualquer navegador. Login
com e-mail e senha (Firebase Auth de verdade), restrito ao e-mail do
Thiago pela regra do Firestore.

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

### Por que precisa de um "empurrão" externo (cron-job.org)

O workflow tem um agendamento próprio (`schedule: cron: '*/10 * * * *'`),
mas o GitHub não garante rodar isso pontualmente em repositórios pouco
movimentados como este. Na prática, os agendamentos vinham saindo de 3 em
3 horas em vez de 10 em 10 minutos, o suficiente pra tarefa vencer e
ninguém ser avisado a tempo.

A solução, ainda de graça: um serviço externo (ex.: [cron-job.org](https://cron-job.org))
chama a API do GitHub a cada poucos minutos pra disparar o workflow na
hora certa, sem depender do agendamento interno do GitHub. Passo a passo:

1. No GitHub, gerar um token de acesso restrito só a este repositório:
   Settings da conta → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token. Em "Repository access",
   escolher "Only select repositories" e marcar só `produtividade`. Em
   "Permissions", dar "Read and write" pra "Actions". Copiar o token
   gerado (só aparece uma vez).
2. Criar uma conta gratuita em cron-job.org.
3. Criar um novo cronjob apontando pra:
   `https://api.github.com/repos/thiagojoc/produtividade/actions/workflows/check-tasks.yml/dispatches`
   - Método: `POST`
   - Nos headers (aba "Advanced" ou "Headers"): `Authorization: Bearer SEU_TOKEN_AQUI`
     e `Accept: application/vnd.github+json`
   - No corpo (body) da requisição: `{"ref":"main"}`
   - Intervalo: a cada 5 minutos
4. Salvar e deixar rodando. O agendamento interno do GitHub continua
   como reforço (caso o cron-job.org fique fora do ar), mas quem garante
   a pontualidade na prática passa a ser esse ping externo.

O token do GitHub fica só na configuração do cronjob (nunca é commitado
neste repositório).
