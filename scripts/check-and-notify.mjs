// Roda fora do navegador, agendado pelo GitHub Actions
// (.github/workflows/check-tasks.yml), de tempos em tempos. É esse script
// que faz a notificação funcionar mesmo com o app fechado em todo lugar
// (computador desligado, celular sem o navegador aberto etc.), porque quem
// decide "essa tarefa venceu" deixa de ser o navegador com a aba aberta e
// passa a ser essa verificação rodando na nuvem, de graça, dentro do
// GitHub Actions.
//
// Usa os mesmos campos e a mesma regra de negócio do index.html
// (notifiedReminder com reminderMinutes antes do vencimento, notifiedDue,
// notifiedOverdue com prazo de 5 minutos pra virar "atrasada"), pra nunca
// duplicar aviso: quem marcar o campo primeiro (o navegador aberto de
// alguém ou esse script) já resolve pros dois lados, porque o dado é
// sincronizado pelo mesmo documento no Firestore.
import admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if(!serviceAccountJson){
  console.error('Faltou o secret FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço do Firebase) nas Actions do repositório.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccountJson))
});

const db = admin.firestore();
const docRef = db.doc('atividades_app/main');
const OVERDUE_AFTER_MS = 5 * 60 * 1000; // mesmo prazo usado no index.html
const URGENCY_LABELS = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

// corpo da notificação: mesma regra do index.html, sempre mostra a
// urgência e a nota/descrição da tarefa quando tiver uma.
function notificationBody(t, fallback){
  const urgencyLabel = URGENCY_LABELS[t.urgency] || 'Média';
  return 'Urgência: ' + urgencyLabel + ' · ' + (t.note || fallback);
}

// Modo de teste (workflow_dispatch com input "modo: teste_push"): manda uma
// notificação de verdade agora mesmo, pra qualquer token salvo, sem
// depender de nenhuma tarefa estar vencendo. Serve só pra confirmar que a
// entrega do push funciona de ponta a ponta (service worker, FCM) com o
// app fechado, sem mexer em nenhuma tarefa real.
const TEST_PUSH = process.env.TEST_PUSH === 'true';

async function sendAndReport(tokens, title, body){
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: { fcmOptions: { link: 'https://thiagojoc.github.io/produtividade/' } }
  });
  const invalidTokens = new Set();
  res.responses.forEach((r, i) => {
    if(!r.success){
      const code = r.error && r.error.code;
      if(code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'){
        invalidTokens.add(tokens[i]);
      }
      console.warn('Falha ao enviar pro token terminado em ...' + tokens[i].slice(-8) + ':', code || (r.error && r.error.message) || r.error);
    } else {
      console.log('Enviado com sucesso pro token terminado em ...' + tokens[i].slice(-8) + '.');
    }
  });
  console.log('Enviado "' + title + '": ' + res.successCount + '/' + tokens.length + ' com sucesso.');
  return invalidTokens;
}

async function main(){
  const snap = await docRef.get();
  if(!snap.exists){
    console.log('Documento atividades_app/main ainda não existe, nada a verificar.');
    return;
  }
  const data = snap.data() || {};
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const tokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];

  if(!tokens.length){
    console.log('Nenhum token de notificação salvo ainda (ninguém ativou as notificações num navegador/celular).');
    return;
  }
  console.log(tokens.length + ' token(s) salvo(s) no momento.');

  if(TEST_PUSH){
    console.log('Modo de teste: mandando notificação agora, sem checar tarefas.');
    const invalidTokens = await sendAndReport(tokens, 'Teste de notificação', 'Se isso chegou com o app fechado, o push está funcionando.');
    if(invalidTokens.size){
      await docRef.set({ fcmTokens: tokens.filter(tk => !invalidTokens.has(tk)) }, { merge: true });
      console.log('Removendo ' + invalidTokens.size + ' token(s) inválido(s)/expirado(s).');
    }
    return;
  }

  const doneColIds = new Set(columns.filter(c => c.done).map(c => c.id));
  const now = Date.now();
  const pendingMessages = []; // { title, body }

  tasks.forEach(t => {
    if(!t.dueAt) return;
    if(doneColIds.has(t.columnId)) return;
    const due = new Date(t.dueAt).getTime();
    if(Number.isNaN(due)) return;
    if(t.reminderMinutes && !t.notifiedReminder && now >= due - t.reminderMinutes * 60 * 1000){
      pendingMessages.push({ title: 'Daqui a ' + t.reminderMinutes + ' min: ' + t.title, body: notificationBody(t, 'Está quase na hora.') });
      t.notifiedReminder = true;
    }
    if(!t.notifiedDue && now >= due){
      pendingMessages.push({ title: 'Chegou a hora: ' + t.title, body: notificationBody(t, 'Essa tarefa venceu agora.') });
      t.notifiedDue = true;
    }
    if(!t.notifiedOverdue && now >= due + OVERDUE_AFTER_MS){
      pendingMessages.push({ title: 'Tarefa atrasada: ' + t.title, body: notificationBody(t, 'Já passou do prazo.') });
      t.notifiedOverdue = true;
    }
  });

  if(!pendingMessages.length){
    console.log('Nenhuma tarefa vencendo ou atrasando agora.');
    return;
  }

  const invalidTokens = new Set();
  for(const msg of pendingMessages){
    const invalid = await sendAndReport(tokens, msg.title, msg.body);
    invalid.forEach(tk => invalidTokens.add(tk));
  }

  const update = { tasks };
  if(invalidTokens.size){
    update.fcmTokens = tokens.filter(tk => !invalidTokens.has(tk));
    console.log('Removendo ' + invalidTokens.size + ' token(s) inválido(s)/expirado(s).');
  }
  await docRef.set(update, { merge: true });
  console.log('Estado salvo no Firestore.');
}

main().catch(err => { console.error(err); process.exit(1); });
