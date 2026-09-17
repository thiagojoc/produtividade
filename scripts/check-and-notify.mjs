// Roda fora do navegador, agendado pelo GitHub Actions
// (.github/workflows/check-tasks.yml), de tempos em tempos. É esse script
// que faz a notificação funcionar mesmo com o app fechado em todo lugar
// (computador desligado, celular sem o navegador aberto etc.), porque quem
// decide "essa tarefa venceu" deixa de ser o navegador com a aba aberta e
// passa a ser essa verificação rodando na nuvem, de graça, dentro do
// GitHub Actions.
//
// Usa os mesmos campos e a mesma regra de negócio do index.html
// (notifiedDue, notifiedOverdue, prazo de 5 minutos pra virar "atrasada"),
// pra nunca duplicar aviso: quem marcar o campo primeiro (o navegador
// aberto de alguém ou esse script) já resolve pros dois lados, porque o
// dado é sincronizado pelo mesmo documento no Firestore.
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

  const doneColIds = new Set(columns.filter(c => c.done).map(c => c.id));
  const now = Date.now();
  const pendingMessages = []; // { title, body }

  tasks.forEach(t => {
    if(!t.dueAt) return;
    if(doneColIds.has(t.columnId)) return;
    const due = new Date(t.dueAt).getTime();
    if(Number.isNaN(due)) return;
    if(!t.notifiedDue && now >= due){
      pendingMessages.push({ title: 'Chegou a hora: ' + t.title, body: t.note || 'Essa tarefa venceu agora.' });
      t.notifiedDue = true;
    }
    if(!t.notifiedOverdue && now >= due + OVERDUE_AFTER_MS){
      pendingMessages.push({ title: 'Tarefa atrasada: ' + t.title, body: t.note || 'Já passou do prazo.' });
      t.notifiedOverdue = true;
    }
  });

  if(!pendingMessages.length){
    console.log('Nenhuma tarefa vencendo ou atrasando agora.');
    return;
  }

  const invalidTokens = new Set();
  for(const msg of pendingMessages){
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: msg.title, body: msg.body },
      webpush: { fcmOptions: { link: 'https://thiagojoc.github.io/produtividade/' } }
    });
    res.responses.forEach((r, i) => {
      if(!r.success){
        const code = r.error && r.error.code;
        if(code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token'){
          invalidTokens.add(tokens[i]);
        }
        console.warn('Falha ao enviar pra um token:', code || (r.error && r.error.message) || r.error);
      }
    });
    console.log('Enviado "' + msg.title + '": ' + res.successCount + '/' + tokens.length + ' com sucesso.');
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
