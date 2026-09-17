// Service worker do Firebase Cloud Messaging. Fica rodando em segundo
// plano no navegador (mesmo com a aba do app fechada) e é quem recebe os
// avisos de tarefa vencida/atrasada mandados pelo GitHub Actions
// (scripts/check-and-notify.mjs), mostrando a notificação do sistema.
//
// Precisa ficar na raiz do site (mesma pasta do index.html) pra cobrir o
// domínio inteiro. Service worker não é módulo ES, por isso usa a versão
// "compat" do SDK do Firebase via importScripts, não os imports normais.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBTqzj-9-AOI181sPCKvRsVGDujkWogIGI",
  authDomain: "flowbody-30162.firebaseapp.com",
  projectId: "flowbody-30162",
  storageBucket: "flowbody-30162.firebasestorage.app",
  messagingSenderId: "440511544358",
  appId: "1:440511544358:web:00dc29d16295ed23f3fae7"
});

const messaging = firebase.messaging();

// Mensagem chegando com a aba fechada ou em segundo plano: monta a
// notificação do sistema operacional com o título/corpo mandados pelo
// script de verificação.
messaging.onBackgroundMessage((payload) => {
  const data = payload.notification || {};
  self.registration.showNotification(data.title || 'Produtividade', {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  });
});

// Clicar na notificação abre (ou foca) a aba do app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
