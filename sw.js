// ShiftLog Service Worker for Push Notifications

const CACHE_NAME = 'shiftlog-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // Navigate to notifications if it's a message notification
          if (event.notification.data?.type === 'message') {
            client.postMessage({ type: 'NAVIGATE', url: '/notifications' });
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/notifications');
      }
    })
  );
});

// Handle push events (for future server-sent push notifications)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'shiftlog-push',
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(data.title || 'ShiftLog', options));
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});
