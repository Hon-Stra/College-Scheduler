// service-worker.js
// This service worker file enables Progressive Web App (PWA) functionality.
// It caches all necessary assets to provide offline access.

// Increment the CACHE_NAME to force the service worker to fetch new assets
const CACHE_NAME = 'college-schedule-app-v27'; // Increment cache name to ensure update
// IMPORTANT: Replace 'College-Schedule' with your actual repository name.
const REPO_NAME = '/College-Schedule';

// List of files to be cached. This is crucial for offline access.
const urlsToCache = [
    `${REPO_NAME}/`,
    `${REPO_NAME}/index.html`,
    `${REPO_NAME}/style.css`,
    `${REPO_NAME}/script.js`,
    `${REPO_NAME}/data.js`,
    `${REPO_NAME}/tailwind.css`, // Local Tailwind CSS
    // All individual schedule files must be listed here for offline access
    `${REPO_NAME}/schedules/ioa-bsa-1-1stsem-year-1.js`,
    `${REPO_NAME}/schedules/eng-ee-1-spring-2026.js`,
    `${REPO_NAME}/schedules/cthm-dhm-1-1stsem-year-1.js`,
    `${REPO_NAME}/schedules/bsba-m-d-1stsem-year-3.js`,
    // Add any new schedule files here, remembering to prepend REPO_NAME
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50xmM...'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event triggered. Caching static assets...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache opened.');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: All URLs added to cache.');
                // Forces the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return response;
                }
                console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request).catch(() => {
                    console.log('Service Worker: Fetch failed, serving offline fallback.');
                    // You can customize this offline fallback page
                    return new Response('<h1>You are offline</h1><p>Please connect to the internet to view this content.</p>', {
                        headers: { 'Content-Type': 'text/html' }
                    });
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event triggered.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    event.waitUntil(self.clients.claim());
});
