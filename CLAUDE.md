# Instruções de estilo (Thiago)

- **Nunca usar travessão (— ou –)** em nenhum texto criado para o Thiago:
  nem em código, nem em comentários, nem em textos de interface, nem em
  respostas de chat, nem em commits. Usar vírgula, ponto, dois pontos,
  parênteses ou a palavra "ou"/"e" no lugar.
- **Tipografia grande desde o início.** Em qualquer HTML/CSS criado para o
  Thiago, nunca começar com fontes pequenas (10-13px) esperando ele pedir
  pra aumentar depois. Textos de apoio/legendas: mínimo ~14px. Texto de
  corpo/inputs: ~15-16px. Títulos de modal: ~20px+. Já aconteceu duas
  vezes (este app e o CRM flowsales-crm) de precisar corrigir depois
  porque nasceu pequeno demais; a referência a seguir é essa correção.
- **Toda tela de login criada pro Thiago precisa ter**: (1) o "olhinho" no
  campo de senha, pra mostrar/ocultar o que foi digitado (botão `.pass-eye`
  dentro de um `.pass-wrap`, ver padrão em index.html e no crmflowsalessjc.html
  do flowsales-crm); (2) opção "Esqueci minha senha" que já dispara o
  e-mail de redefinição de verdade (`sendPasswordResetEmail` do Firebase
  Auth), não só um link decorativo. Vale desde a primeira versão da tela,
  não só depois que der problema de login.

# Sobre este projeto

App pessoal de gestão de atividades (Kanban), single file (`index.html`),
sem build. Login com e-mail e senha (Firebase Auth de verdade, restrito ao
e-mail do Thiago via regra do Firestore). Sincroniza via Firestore no
mesmo projeto Firebase usado pelas outras ferramentas do Thiago (coleção
`atividades_app/main`). Publicado via GitHub Pages.
