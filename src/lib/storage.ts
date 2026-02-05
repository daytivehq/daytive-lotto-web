/**
 * localStorage 유틸리티
 * 브라우저 저장소를 통한 데이터 영속화
 */

import type { LottoNumbers } from './lotto'
import { generateLottoNumbers, getTodayString } from './lotto'

const STORAGE_KEYS = {
  DAILY_NUMBERS: 'lotto_daily_numbers',
  FAVORITES: 'lotto_favorites',
  HISTORY: 'lotto_history',
} as const

export interface DailyNumbersData {
  [date: string]: LottoNumbers
}

export interface FavoriteItem {
  id: string
  numbers: number[]
  memo?: string
  createdAt: string
}

export interface HistoryItem {
  numbers: number[]
  date: string
  type: 'daily' | 'refresh'
}

/**
 * localStorage에서 안전하게 데이터를 가져옵니다.
 */
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * localStorage에 데이터를 저장합니다.
 */
function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

/**
 * 오늘의 번호를 가져옵니다. 없으면 새로 생성합니다.
 */
export function getTodayNumbers(): LottoNumbers {
  const today = getTodayString()
  const dailyData = getStorageItem<DailyNumbersData>(STORAGE_KEYS.DAILY_NUMBERS, {})

  if (dailyData[today]) {
    return dailyData[today]
  }

  // 새 번호 생성
  const newNumbers: LottoNumbers = {
    numbers: generateLottoNumbers(),
    createdAt: new Date().toISOString(),
  }

  dailyData[today] = newNumbers
  setStorageItem(STORAGE_KEYS.DAILY_NUMBERS, dailyData)

  return newNumbers
}

/**
 * 오늘의 번호를 새로 생성합니다.
 */
export function refreshTodayNumbers(): LottoNumbers {
  const today = getTodayString()
  const dailyData = getStorageItem<DailyNumbersData>(STORAGE_KEYS.DAILY_NUMBERS, {})

  const newNumbers: LottoNumbers = {
    numbers: generateLottoNumbers(),
    createdAt: new Date().toISOString(),
  }

  dailyData[today] = newNumbers
  setStorageItem(STORAGE_KEYS.DAILY_NUMBERS, dailyData)

  // 히스토리에 추가
  addToHistory(newNumbers.numbers, 'refresh')

  return newNumbers
}

/**
 * 즐겨찾기 목록을 가져옵니다.
 */
export function getFavorites(): FavoriteItem[] {
  return getStorageItem<FavoriteItem[]>(STORAGE_KEYS.FAVORITES, [])
}

/**
 * 즐겨찾기에 번호를 추가합니다.
 */
export function addToFavorites(numbers: number[], memo?: string): FavoriteItem {
  const favorites = getFavorites()

  const newItem: FavoriteItem = {
    id: crypto.randomUUID(),
    numbers,
    memo,
    createdAt: new Date().toISOString(),
  }

  favorites.unshift(newItem)
  setStorageItem(STORAGE_KEYS.FAVORITES, favorites)

  return newItem
}

/**
 * 즐겨찾기에서 번호를 제거합니다.
 */
export function removeFromFavorites(id: string): void {
  const favorites = getFavorites()
  const filtered = favorites.filter(item => item.id !== id)
  setStorageItem(STORAGE_KEYS.FAVORITES, filtered)
}

/**
 * 번호가 이미 즐겨찾기에 있는지 확인합니다.
 */
export function isFavorite(numbers: number[]): boolean {
  const favorites = getFavorites()
  const numbersStr = numbers.join(',')
  return favorites.some(item => item.numbers.join(',') === numbersStr)
}

/**
 * 히스토리 목록을 가져옵니다.
 */
export function getHistory(): HistoryItem[] {
  return getStorageItem<HistoryItem[]>(STORAGE_KEYS.HISTORY, [])
}

/**
 * 히스토리에 번호를 추가합니다.
 */
export function addToHistory(numbers: number[], type: 'daily' | 'refresh'): void {
  const history = getHistory()

  const newItem: HistoryItem = {
    numbers,
    date: new Date().toISOString(),
    type,
  }

  history.unshift(newItem)

  // 최대 100개까지만 보관
  const trimmed = history.slice(0, 100)
  setStorageItem(STORAGE_KEYS.HISTORY, trimmed)
}
