/**
 * 로또 당첨번호 API 클라이언트
 * Cloudflare Worker API: api.lotto.daytive.com
 */

const API_BASE = 'https://api.lotto.daytive.com'
const CACHE_KEY = 'lotto_winning_cache'

export interface WinningData {
  round: number
  date: string
  numbers: number[]
  bonusNumber: number
  totalSales: number
  firstPrize: number
  firstWinners: number
}

interface CacheEntry {
  data: WinningData
  cachedAt: number
}

interface CacheStore {
  [round: string]: CacheEntry
  latest?: CacheEntry
}

function getCache(): CacheStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setCache(store: CacheStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('Failed to cache winning data:', error)
  }
}

/**
 * 다음 토요일 21:00 (추첨 후 여유시간) 까지의 밀리초를 반환합니다.
 * 이미 토요일 21시 이후면 다음 주 토요일까지.
 */
function getNextDrawMs(): number {
  const now = new Date()
  const day = now.getDay() // 0=일 6=토
  const hour = now.getHours()

  let daysUntilSat = (6 - day + 7) % 7
  if (daysUntilSat === 0 && hour >= 21) {
    daysUntilSat = 7
  }

  const nextDraw = new Date(now)
  nextDraw.setDate(now.getDate() + daysUntilSat)
  nextDraw.setHours(21, 0, 0, 0)

  return nextDraw.getTime() - now.getTime()
}

function isCacheFresh(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false
  return Date.now() - entry.cachedAt < getNextDrawMs()
}

function hasCacheData(entry: CacheEntry | undefined): entry is CacheEntry {
  return !!entry?.data
}

function updateCache(cache: CacheStore, key: string, data: WinningData): void {
  const entry: CacheEntry = { data, cachedAt: Date.now() }
  cache[key] = entry
  if (key !== 'latest') {
    // 특정 회차 캐시는 영구 보관 (결과가 바뀌지 않음)
  }
  setCache(cache)
}

/**
 * 최신 회차 당첨번호를 가져옵니다.
 * stale-while-revalidate: 캐시가 있으면 즉시 반환 + 백그라운드 갱신
 */
export async function fetchLatestWinning(
  onUpdate?: (data: WinningData) => void
): Promise<WinningData> {
  const cache = getCache()

  // 캐시가 fresh하면 바로 반환
  if (isCacheFresh(cache.latest)) {
    return cache.latest.data
  }

  // 캐시가 stale이지만 데이터가 있으면 → 즉시 반환 + 백그라운드 갱신
  if (hasCacheData(cache.latest)) {
    fetch(`${API_BASE}/round/latest`)
      .then(res => res.ok ? res.json() : null)
      .then((data: WinningData | null) => {
        if (data && data.round !== cache.latest?.data.round) {
          updateCache(cache, 'latest', data)
          updateCache(cache, String(data.round), data)
          onUpdate?.(data)
        } else if (data) {
          // 같은 회차라도 캐시 시간 갱신
          updateCache(cache, 'latest', data)
        }
      })
      .catch(() => {})

    return cache.latest.data
  }

  // 캐시가 전혀 없으면 네트워크 대기
  const res = await fetch(`${API_BASE}/round/latest`)
  if (!res.ok) throw new Error('최신 당첨번호를 불러올 수 없습니다.')

  const data: WinningData = await res.json()
  updateCache(cache, 'latest', data)
  updateCache(cache, String(data.round), data)

  return data
}

/**
 * 특정 회차 당첨번호를 가져옵니다.
 * 과거 회차는 결과가 바뀌지 않으므로 캐시가 있으면 영구 사용합니다.
 */
export async function fetchWinningByRound(round: number): Promise<WinningData> {
  const cache = getCache()
  const key = String(round)

  // 과거 회차는 결과가 불변이므로 캐시가 있으면 항상 사용
  if (hasCacheData(cache[key])) {
    return cache[key].data
  }

  const res = await fetch(`${API_BASE}/round/${round}`)
  if (!res.ok) throw new Error(`${round}회차 정보를 불러올 수 없습니다.`)

  const data: WinningData = await res.json()
  updateCache(cache, key, data)

  return data
}

/**
 * 여러 회차의 당첨번호를 병렬로 가져옵니다.
 * 동시 요청 수를 제한하여 API 부하를 방지합니다.
 */
export async function fetchMultipleRounds(
  latestRound: number,
  count: number,
  onProgress?: (loaded: number, total: number) => void
): Promise<WinningData[]> {
  const BATCH_SIZE = 10
  const rounds = Array.from({ length: count }, (_, i) => latestRound - i)
  const results: WinningData[] = []

  for (let i = 0; i < rounds.length; i += BATCH_SIZE) {
    const batch = rounds.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(round => fetchWinningByRound(round).catch(() => null))
    )
    for (const data of batchResults) {
      if (data) results.push(data)
    }
    onProgress?.(Math.min(i + BATCH_SIZE, rounds.length), rounds.length)
  }

  return results
}

/**
 * 내 번호와 당첨번호를 비교하여 결과를 반환합니다.
 */
export interface MatchResult {
  matchedNumbers: number[]
  matchCount: number
  hasBonusMatch: boolean
  rank: string | null
}

export function checkWinning(myNumbers: number[], winning: WinningData): MatchResult {
  const matchedNumbers = myNumbers.filter(n => winning.numbers.includes(n))
  const matchCount = matchedNumbers.length
  const hasBonusMatch = myNumbers.includes(winning.bonusNumber)

  let rank: string | null = null
  if (matchCount === 6) rank = '1등'
  else if (matchCount === 5 && hasBonusMatch) rank = '2등'
  else if (matchCount === 5) rank = '3등'
  else if (matchCount === 4) rank = '4등'
  else if (matchCount === 3) rank = '5등'

  return { matchedNumbers, matchCount, hasBonusMatch, rank }
}
