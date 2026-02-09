// Daytive Lotto - Service Worker
// 버전을 변경하면 새 서비스 워커가 설치되면서 캐시가 갱신됩니다.
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `lotto-static-${CACHE_VERSION}`
const API_CACHE = `lotto-api-${CACHE_VERSION}`

// 오프라인에서도 동작해야 하는 핵심 페이지
const PRECACHE_URLS = [
  '/',
  '/winning',
  '/favorites',
  '/manifest.json',
  '/favicon.svg',
]

// 설치: 핵심 리소스를 미리 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// 활성화: 이전 버전의 캐시를 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // POST 등 GET이 아닌 요청은 그대로 통과
  if (request.method !== 'GET') return

  // API 요청: Network First (네트워크 실패 시 캐시)
  if (url.hostname === 'api.lotto.daytive.com') {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // GA, 외부 스크립트 등은 그대로 통과
  if (url.origin !== self.location.origin) return

  // 정적 리소스: Cache First (캐시에 없으면 네트워크)
  event.respondWith(cacheFirst(request, STATIC_CACHE))
})

// Cache First 전략: 캐시 → 네트워크 → 캐시 저장
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // 오프라인 + 캐시 미스 → 메인 페이지로 폴백
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('오프라인입니다.', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
    return new Response('', { status: 503 })
  }
}

// Network First 전략: 네트워크 → 캐시 저장 / 실패 시 캐시
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: '오프라인입니다.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
