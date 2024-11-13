import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
    setupForegroundNotifications();
  }, []);

  const setupForegroundNotifications = () => {
    try {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        // Afficher une notification native en plus de la notification toast
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.notification?.title || '', {
            body: payload.notification?.body,
            icon: '/pwa-192x192.png'
          });
        }

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {payload.notification?.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {payload.notification?.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), { duration: 4000 });
      });
    } catch (error) {
      console.error('Error setting up foreground notifications:', error);
    }
  };

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.permission;
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        await registerDeviceToken();
      }
    }
  };

  const registerDeviceToken = async () => {
    try {
      const messaging = getMessaging();
      // Forcer le renouvellement du token
      const token = await getToken(messaging, {
        vapidKey: 'BDH-gbFrmGTivcys3i6rO7F9cB9nInRBF5Z65I9R5_TftQPh9r0TphArfg2z04PYk9hQVDHfyIbKAe8UUnmJMhM',
        forceRefresh: true
      });

      if (token) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          fcmToken: token,
          email: currentUser.email,
          lastTokenUpdate: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  };

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerDeviceToken();
        setNotificationsEnabled(true);
        toast.success('Notifications activées avec succès!');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'activation des notifications');
      console.error('Error enabling notifications:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          {!notificationsEnabled && (
            <button
              onClick={enableNotifications}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Bell className="h-5 w-5 mr-2" />
              Activer les notifications
            </button>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">État des notifications</h2>
            <p className="text-gray-600">
              {notificationsEnabled
                ? '✅ Les notifications sont activées'
                : '❌ Les notifications ne sont pas activées'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}