/**
 * 로또 번호 생성 유틸리티
 */

export interface LottoNumbers {
  numbers: number[]
  createdAt: string
}

/**
 * 1~45 사이의 랜덤한 6개 번호를 생성합니다.
 * 제외 번호는 생성에서 빠지고, 포함 번호는 반드시 결과에 포함됩니다.
 * 번호는 오름차순으로 정렬됩니다.
 */
export function generateLottoNumbers(
  excluded: number[] = [],
  included: number[] = [],
): number[] {
  const excludedSet = new Set(excluded)
  const validIncluded = included.filter(n => !excludedSet.has(n) && n >= 1 && n <= 45)

  if (validIncluded.length > 6) {
    return validIncluded.slice(0, 6).sort((a, b) => a - b)
  }

  const numbers: Set<number> = new Set(validIncluded)
  const pool = Array.from({ length: 45 }, (_, i) => i + 1)
    .filter(n => !excludedSet.has(n) && !numbers.has(n))

  while (numbers.size < 6 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    numbers.add(pool[idx])
    pool.splice(idx, 1)
  }

  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 두 번호 배열을 비교하여 일치하는 번호 개수를 반환합니다.
 */
export function compareNumbers(userNumbers: number[], winningNumbers: number[]): number {
  return userNumbers.filter(num => winningNumbers.includes(num)).length
}

/**
 * 일치 개수와 보너스 번호 일치 여부로 등수를 판정합니다.
 */
export function determineRank(
  matchCount: number,
  hasBonusMatch: boolean
): string | null {
  if (matchCount === 6) return '1등'
  if (matchCount === 5 && hasBonusMatch) return '2등'
  if (matchCount === 5) return '3등'
  if (matchCount === 4) return '4등'
  if (matchCount === 3) return '5등'
  return null
}
