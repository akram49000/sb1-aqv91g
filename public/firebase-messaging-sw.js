importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCuJTsv1VFOc01c9FEGzEiBXNxM64xj7uM",
  authDomain: "uacomapp.firebaseapp.com",
  projectId: "uacomapp",
  storageBucket: "uacomapp.firebasestorage.app",
  messagingSenderId: "8265272205",
  appId: "1:8265272205:web:66bfbc4a58ee5184db8bc4"
});

const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'notification',
    data: payload.data,
    requireInteraction: true,
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});