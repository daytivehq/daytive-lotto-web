/**
 * 로또 당첨번호 API 클라이언트
 * Cloudflare Worker API: api.lotto.daytive.com
 */

const API_BASE = 'https://api.lotto.daytive.com'
const CACHE_KEY = 'lotto_winning_cache'
const CACHE_TTL = 1000 * 60 * 30 // 30분

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

function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false
  return Date.now() - entry.cachedAt < CACHE_TTL
}

/**
 * 최신 회차 당첨번호를 가져옵니다.
 */
export async function fetchLatestWinning(): Promise<WinningData> {
  const cache = getCache()

  if (isCacheValid(cache.latest)) {
    return cache.latest.data
  }

  const res = await fetch(`${API_BASE}/round/latest`)
  if (!res.ok) throw new Error('최신 당첨번호를 불러올 수 없습니다.')

  const data: WinningData = await res.json()
  const entry: CacheEntry = { data, cachedAt: Date.now() }

  cache.latest = entry
  cache[String(data.round)] = entry
  setCache(cache)

  return data
}

/**
 * 특정 회차 당첨번호를 가져옵니다.
 */
export async function fetchWinningByRound(round: number): Promise<WinningData> {
  const cache = getCache()
  const key = String(round)

  if (isCacheValid(cache[key])) {
    return cache[key].data
  }

  const res = await fetch(`${API_BASE}/round/${round}`)
  if (!res.ok) throw new Error(`${round}회차 정보를 불러올 수 없습니다.`)

  const data: WinningData = await res.json()
  cache[key] = { data, cachedAt: Date.now() }
  setCache(cache)

  return data
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
