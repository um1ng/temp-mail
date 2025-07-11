const CACHE_NAME = 'tempmail-v1.0.0';
const STATIC_CACHE_NAME = 'tempmail-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'tempmail-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 添加其他静态资源
];

// 需要缓存的API路径
const CACHE_API_PATTERNS = [
  '/api/addresses',
  '/api/emails',
];

// 不需要缓存的API路径
const NO_CACHE_PATTERNS = [
  '/api/emails/*/forward',
  '/api/emails/*/share',
  '/api/send-test-email',
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('tempmail-') && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// 获取事件
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过Chrome扩展和其他协议
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 处理导航请求（页面请求）
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // 缓存成功的导航响应
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // 离线时返回缓存的首页
              return caches.match('/');
            });
        })
    );
    return;
  }

  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    // 检查是否为不缓存的API
    const shouldNotCache = NO_CACHE_PATTERNS.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '[^/]+'));
      return regex.test(url.pathname);
    });

    if (shouldNotCache) {
      // 直接发送请求，不缓存
      event.respondWith(fetch(request));
      return;
    }

    // 检查是否为需要缓存的API
    const shouldCache = CACHE_API_PATTERNS.some(pattern => 
      url.pathname.startsWith(pattern)
    );

    if (shouldCache && request.method === 'GET') {
      event.respondWith(
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            return cache.match(request)
              .then((cachedResponse) => {
                // 网络优先策略
                const fetchPromise = fetch(request)
                  .then((networkResponse) => {
                    if (networkResponse.status === 200) {
                      cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                  })
                  .catch(() => {
                    // 网络失败时返回缓存
                    return cachedResponse;
                  });

                // 如果有缓存且网络请求超过1秒，先返回缓存
                if (cachedResponse) {
                  return Promise.race([
                    fetchPromise,
                    new Promise((resolve) => {
                      setTimeout(() => resolve(cachedResponse), 1000);
                    })
                  ]);
                }

                return fetchPromise;
              });
          })
      );
      return;
    }

    // 其他API请求直接发送
    event.respondWith(fetch(request));
    return;
  }

  // 处理静态资源
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // 缓存成功的静态资源响应
            if (response.status === 200 && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          });
      })
  );
});

// 推送事件
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  const options = {
    body: '您收到了新邮件',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'new-email',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '查看',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification('临时邮箱', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 查找已打开的窗口
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 打开新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-emails') {
    event.waitUntil(
      // 在后台同步邮件
      syncEmails()
    );
  }
});

// 同步邮件函数
async function syncEmails() {
  try {
    // 获取所有活跃的邮箱地址
    const response = await fetch('/api/addresses');
    if (!response.ok) return;
    
    const { addresses } = await response.json();
    
    // 为每个邮箱检查新邮件
    for (const address of addresses) {
      if (address.isActive) {
        await fetch(`/api/emails?emailAddressId=${address.id}`);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// 消息事件
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.payload);
        })
    );
  }
});