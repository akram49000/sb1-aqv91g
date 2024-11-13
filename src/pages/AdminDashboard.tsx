import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  fcmToken: string;
  lastTokenUpdate?: string;
}

interface NotificationStatus {
  id: string;
  title: string;
  sent?: boolean;
  sentAt?: Date;
  successCount?: number;
  failureCount?: number;
  error?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState({
    title: '',
    body: ''
  });
  const [sending, setSending] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationStatus[]>([]);

  useEffect(() => {
    fetchUsers();
    subscribeToNotifications();
  }, []);

  const subscribeToNotifications = () => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationStatus[];
      setNotificationHistory(notifications);
    });
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (error) {
      toast.error('Erreur lors de la récupération des utilisateurs');
    }
  };

  const sendNotification = async () => {
    if (sending) return;
    
    try {
      setSending(true);
      const validTokens = users
        .filter(user => user.fcmToken && user.lastTokenUpdate)
        .map(user => user.fcmToken);

      if (validTokens.length === 0) {
        toast.error('Aucun utilisateur avec un token valide');
        return;
      }

      await addDoc(collection(db, 'notifications'), {
        title: notification.title,
        body: notification.body,
        timestamp: new Date(),
        recipients: validTokens,
        priority: 'high',
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          sound: 'default'
        }
      });

      setNotification({ title: '', body: '' });
      toast.success('Notification créée avec succès!');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Administration</h1>
        
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-gray-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Utilisateurs ({users.length})</h2>
              </div>
              <button
                onClick={fetchUsers}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Rafraîchir
              </button>
            </div>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span>{user.email}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.fcmToken && user.lastTokenUpdate
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.fcmToken && user.lastTokenUpdate
                        ? 'Notifications activées'
                        : 'Notifications désactivées'}
                    </span>
                    {user.lastTokenUpdate && (
                      <span className="text-xs text-gray-500">
                        Mis à jour: {new Date(user.lastTokenUpdate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Send className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Envoyer une notification</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  type="text"
                  value={notification.title}
                  onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={notification.body}
                  onChange={(e) => setNotification(prev => ({ ...prev, body: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={sendNotification}
                disabled={sending || !notification.title || !notification.body}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Historique des notifications</h2>
            <div className="space-y-2">
              {notificationHistory.map((notif) => (
                <div key={notif.id} className="p-3 bg-white rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{notif.title}</h3>
                      <p className="text-sm text-gray-500">
                        {notif.sentAt ? new Date(notif.sentAt).toLocaleString() : 'En attente...'}
                      </p>
                    </div>
                    <div className="text-right">
                      {notif.sent === undefined ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          En cours
                        </span>
                      ) : notif.sent ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Envoyé ({notif.successCount}/{notif.successCount! + notif.failureCount!})
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Échec
                        </span>
                      )}
                    </div>
                  </div>
                  {notif.error && (
                    <p className="mt-2 text-sm text-red-600">{notif.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}