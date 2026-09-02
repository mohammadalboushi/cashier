const CACHE_NAME = 'cashier-app-v1';

// الملفات الأساسية التي يجب تخزينها ليعمل التطبيق بدون إنترنت
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// حدث التثبيت: حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// حدث التفعيل: تنظيف الكاش القديم إن وجد
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// حدث الجلب (Fetch): استراتيجية "الكاش أولاً ثم الشبكة"
self.addEventListener('fetch', (event) => {
    // استثناء طلبات قاعدة بيانات فايربيس من الكاش لمنع تضارب المزامنة
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('google.com')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // إذا وجد الملف في الكاش، قم بإرجاعه فوراً (سرعة عالية وأوفلاين)
            if (cachedResponse) {
                return cachedResponse;
            }
            // إذا لم يوجد، اطلبه من الإنترنت
            return fetch(event.request).then((networkResponse) => {
                // حفظ نسخة من الملف الجديد في الكاش للمرات القادمة
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            // يمكن مستقبلاً إرجاع صفحة "أنت غير متصل بالإنترنت" هنا
        })
    );
});
