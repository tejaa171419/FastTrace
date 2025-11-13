// // Service Worker for ZenithWallet Push Notifications
// // Version: 1.0.0

// const CACHE_NAME = 'FastTrace';
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/logo.png',
//   '/notification-sound.mp3'
// ];

// // Install event - cache essential files
// self.addEventListener('install', event => {
//   console.log('[Service Worker] Installing...');
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => {
//         console.log('[Service Worker] Caching app shell');
//         return cache.addAll(urlsToCache);
//       })
//       .then(() => self.skipWaiting())
//   );
// });

// // Activate event - clean up old caches
// self.addEventListener('activate', event => {
//   console.log('[Service Worker] Activating...');
//   event.waitUntil(
//     caches.keys().then(cacheNames => {
//       return Promise.all(
//         cacheNames.map(cacheName => {
//           if (cacheName !== CACHE_NAME) {
//             console.log('[Service Worker] Removing old cache:', cacheName);
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     }).then(() => self.clients.claim())
//   );
// });

// // Fetch event - serve from cache when offline
// self.addEventListener('fetch', event => {
//   // Skip non-GET requests
//   if (event.request.method !== 'GET') {
//     return;
//   }

//   // Skip WebSocket requests
//   if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) {
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         // Return cached version or fetch from network
//         return response || fetch(event.request);
//       })
//       .catch(() => {
//         // Return offline page if available
//         return caches.match('/offline.html');
//       })
//   );
// });

// // Push event - show notification when push message is received
// self.addEventListener('push', event => {
//   console.log('[Service Worker] Push Received');
  
//   let notificationData = {
//     title: 'ZenithWallet',
//     body: 'You have a new notification',
//     icon: '/icon-192x192.png',
//     badge: '/badge-72x72.png',
//     vibrate: [100, 50, 100],
//     data: {
//       dateOfArrival: Date.now(),
//       primaryKey: 1
//     }
//   };

//   // Parse push message data if available
//   if (event.data) {
//     try {
//       const data = event.data.json();
//       notificationData = {
//         ...notificationData,
//         ...data,
//         data: {
//           ...notificationData.data,
//           ...data.data
//         }
//       };
//     } catch (e) {
//       console.error('[Service Worker] Error parsing push data:', e);
//     }
//   }

//   const options = {
//     body: notificationData.body,
//     icon: notificationData.icon,
//     badge: notificationData.badge,
//     vibrate: notificationData.vibrate,
//     data: notificationData.data,
//     tag: notificationData.tag || 'default',
//     requireInteraction: notificationData.priority === 'urgent',
//     actions: notificationData.actions || [
//       { action: 'view', title: 'View', icon: '/icon-view.png' },
//       { action: 'dismiss', title: 'Dismiss', icon: '/icon-dismiss.png' }
//     ]
//   };

//   event.waitUntil(
//     self.registration.showNotification(notificationData.title, options)
//   );
// });

// // Notification click event - handle notification interactions
// self.addEventListener('notificationclick', event => {
//   console.log('[Service Worker] Notification click received');
  
//   event.notification.close();

//   const action = event.action;
//   const notification = event.notification;
//   const primaryKey = notification.data ? notification.data.primaryKey : null;

//   // Handle different actions
//   if (action === 'dismiss') {
//     // Just close the notification
//     return;
//   }

//   // Default action - open app
//   event.waitUntil(
//     clients.matchAll({ type: 'window', includeUncontrolled: true })
//       .then(clientList => {
//         // Check if app is already open
//         for (let client of clientList) {
//           if (client.url && 'focus' in client) {
//             // Focus existing window and send notification data
//             client.postMessage({
//               type: 'notification-click',
//               notificationId: primaryKey,
//               action: action,
//               data: notification.data
//             });
//             return client.focus();
//           }
//         }
        
//         // Open new window if app is not open
//         if (clients.openWindow) {
//           const url = notification.data && notification.data.url 
//             ? notification.data.url 
//             : '/notifications';
//           return clients.openWindow(url);
//         }
//       })
//   );
// });

// // Background sync event - sync notifications when back online
// self.addEventListener('sync', event => {
//   console.log('[Service Worker] Background sync');
  
//   if (event.tag === 'sync-notifications') {
//     event.waitUntil(syncNotifications());
//   }
// });

// // Sync notifications with server
// async function syncNotifications() {
//   try {
//     const response = await fetch('/api/notifications/sync', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         lastSync: await getLastSyncTime()
//       })
//     });

//     if (response.ok) {
//       const data = await response.json();
//       await saveLastSyncTime(Date.now());
//       return data;
//     }
//   } catch (error) {
//     console.error('[Service Worker] Sync failed:', error);
//     throw error;
//   }
// }

// // Helper functions for IndexedDB storage
// async function getLastSyncTime() {
//   // Implementation would use IndexedDB to store sync time
//   return localStorage.getItem('lastNotificationSync') || 0;
// }

// async function saveLastSyncTime(time) {
//   // Implementation would use IndexedDB to store sync time
//   localStorage.setItem('lastNotificationSync', time.toString());
// }

// // Message event - handle messages from app
// self.addEventListener('message', event => {
//   console.log('[Service Worker] Message received:', event.data);
  
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
  
//   if (event.data && event.data.type === 'CHECK_UPDATES') {
//     // Check for app updates
//     self.registration.update();
//   }
// });