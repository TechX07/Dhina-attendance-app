const CACHE_NAME = 'attendance-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(error => {
        console.warn('Cache addAll error:', error);
        return cache.addAll(['/']);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Always try network first for page navigation so new deploys are picked up.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('/index.html', responseToCache);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Network first for API calls to Supabase
  if (url.pathname.includes('/rest/v1') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful API responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response on network failure
          return caches.match(request).then(response => {
            return response || new Response(
              JSON.stringify({ offline: true }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/index.html');
      });
    })
  );
});

// Background sync for attendance marking
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

async function syncAttendance() {
  try {
    // This will be handled by the app itself
    // Service worker just ensures the attempt to sync
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// Push notifications (optional future enhancement)
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Attendance Manager';
  const options = {
    body: data.body || 'You have a notification',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
