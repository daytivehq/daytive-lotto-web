import { useState, useEffect } from 'react';
import LottoBallGroup from './LottoBallGroup';
import NumberFilter from './NumberFilter';
import type { LottoNumbers } from '@/lib/lotto';
import {
  getTodayNumbers,
  refreshTodayNumbers,
  addToFavorites,
  isFavorite,
} from '@/lib/storage';

export default function LottoGenerator() {
  const [todayNumbers, setTodayNumbers] = useState<LottoNumbers | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const numbers = getTodayNumbers();
    setTodayNumbers(numbers);
    setIsFav(isFavorite(numbers.numbers));
  }, []);

  const handleRefresh = () => {
    setIsAnimating(true);

    setTimeout(() => {
      const newNumbers = refreshTodayNumbers();
      setTodayNumbers(newNumbers);
      setIsFav(isFavorite(newNumbers.numbers));
      setIsAnimating(false);
    }, 300);
  };

  const handleFavorite = () => {
    if (!todayNumbers) return;

    if (!isFav) {
      addToFavorites(todayNumbers.numbers);
      setIsFav(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <>
      <div>
        {/* 번호 표시 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          {todayNumbers ? (
            <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <LottoBallGroup
                numbers={todayNumbers.numbers}
                size="lg"
                animated={!isAnimating}
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="animate-pulse flex gap-2 sm:gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 번호 필터 설정 */}
        <NumberFilter onChanged={handleRefresh} />

        {/* 버튼 그룹 */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleRefresh}
            disabled={isAnimating}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300
                       text-white font-semibold py-3 px-6 rounded-xl
                       transition-colors duration-200
                       flex items-center justify-center gap-2
                       cursor-pointer disabled:cursor-not-allowed"
          >
            <svg
              className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            다시 뽑기
          </button>

          <button
            onClick={handleFavorite}
            disabled={isFav}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-200
                       flex items-center justify-center gap-2 cursor-pointer
                       ${isFav
                         ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                         : 'bg-gray-100 hover:bg-yellow-100 text-gray-600 hover:text-yellow-600 dark:bg-gray-700 dark:hover:bg-yellow-900/30 dark:text-gray-300'
                       }`}
          >
            <svg
              className="w-5 h-5"
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            {isFav ? '저장됨' : '저장'}
          </button>
        </div>
      </div>

      {/* 토스트 메시지 (화면 하단 고정) */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
            즐겨찾기에 저장되었습니다
          </div>
        </div>
      )}
    </>
  );
}
