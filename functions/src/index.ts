import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (!notification.recipients || notification.recipients.length === 0) {
      console.log('No recipients found');
      return null;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
            mutableContent: true
          }
        },
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert'
        }
      },
      tokens: notification.recipients
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Successfully sent notifications:', response);
      
      // Mettre à jour le document avec le statut d'envoi
      await snap.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      console.error('Error sending notifications:', error);
      
      // Mettre à jour le document avec l'erreur
      await snap.ref.update({
        sent: false,
        error: error.message,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    }
  });