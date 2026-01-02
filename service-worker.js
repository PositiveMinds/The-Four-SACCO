const CACHE_NAME = 'sacco-v5';
const RUNTIME_CACHE = 'sacco-runtime-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './browserconfig.xml',
  
  // CSS Files - Complete
  './css/style.css',
  './css/theme.css',
  './css/remixicon.css',
  './css/offline-icons.css',
  './css/framework.css',
  './css/advanced-charts.css',
  './css/form-enhanced.css',
  './css/select2-custom.css',

  // JavaScript Files - All 25 Files
  './js/ai-dashboard.js',
  './js/ai-engine.js',
  './js/analytics-logger.js',
  './js/analytics.js',
  './js/app.js',
  './js/custom-notifications.js',
  './js/device-support.js',
  './js/excel-styling.js',
  './js/export.js',
  './js/indexeddb.js',
  './js/jspdf-loader.js',
  './js/loan-member-fix.js',
  './js/notifications.js',
  './js/offline-excel-generator.js',
  './js/offline-pdf-generator.js',
  './js/offline-resources.js',
  './js/profit-chart.js',
  './js/pwa-checker.js',
  './js/pwa-install.js',
  './js/receipts.js',
  './js/sidebar-features.js',
  './js/storage.js',
  './js/sweetalert-integration.js',
  './js/transactions.js',
  './js/ui.js',
  './js/bootstrap-select-init.js',
  './js/select2-init.js',
  './js/virtual-select-init.js',
  
  // Images - All sizes (Complete List)
  './images/16x16.png',
  './images/32x32.png',
  './images/64x64.png',
  './images/144x144.png',
  './images/180x180.png',
  './images/image-192.png',
  './images/image-384.png',
  './images/image-512.png',
  
  // Vendor - Bootstrap
  './vendor/bootstrap/css/bootstrap.min.css',
  './vendor/bootstrap/js/bootstrap.bundle.min.js',

  // Vendor - jQuery (required by Select2)
  './vendor/jquery/jquery-3.7.1.min.js',

  // Vendor - Select2
  './vendor/select2-develop/select2-develop/dist/css/select2.min.css',
  './vendor/select2-develop/select2-develop/dist/js/select2.min.js',

  // Vendor - RemixIcon Fonts
  './vendor/RemixIcon/fonts/remixicon.css',
  './vendor/RemixIcon/fonts/remixicon.eot',
  './vendor/RemixIcon/fonts/remixicon.ttf',
  './vendor/RemixIcon/fonts/remixicon.woff',
  './vendor/RemixIcon/fonts/remixicon.woff2',

  // Vendor - jsPDF
  './vendor/jsPDF/jspdf.umd.js',
  './vendor/jsPDF/jspdf.plugin.autotable.min.js',

  // Vendor - ECharts
  './vendor/echarts/dist/echarts.min.js',

  // Vendor - SweetAlert2
  './vendor/sweetalert/dist/sweetalert2.all.min.js',
  './vendor/sweetalert/themes/bootstrap-5.css',

  // Vendor - SheetJS
  './vendor/sheetjs/xlsx.full.min.js',

  // Vendor - QRCode
  './vendor/qrcodejs/qrcodejs.min.js',

  // External CSS Libraries (cached for offline)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',

  // External JavaScript Libraries (CDN Fallbacks)
  'https://cdnjs.cloudflare.com/ajax/libs/echarts5/5.4.3/echarts.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('Some assets failed to cache:', error);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and non-GET methods
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.jsdelivr.net') &&
      !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Try network request
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page or fallback
            return new Response('Offline - Check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        });
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Data will be synced when connection is restored
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: './images/image-192.png',
    badge: './images/image-192.png',
    vibrate: [100, 50, 100],
    tag: 'sacco-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Together AS One - SACCO', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
