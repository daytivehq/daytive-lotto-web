import { useState, useEffect } from 'react';
import {
  getExcludedNumbers,
  setExcludedNumbers,
  getIncludedNumbers,
  setIncludedNumbers,
} from '@/lib/storage';

type FilterMode = 'exclude' | 'include';

interface NumberFilterProps {
  onChanged: () => void;
}

export default function NumberFilter({ onChanged }: NumberFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FilterMode>('exclude');
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [included, setIncluded] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExcluded(new Set(getExcludedNumbers()));
    setIncluded(new Set(getIncludedNumbers()));
  }, []);

  const handleToggle = (num: number) => {
    if (mode === 'exclude') {
      const next = new Set(excluded);
      if (next.has(num)) {
        next.delete(num);
      } else {
        // 포함에 있으면 제거
        if (included.has(num)) {
          const nextIncluded = new Set(included);
          nextIncluded.delete(num);
          setIncluded(nextIncluded);
          setIncludedNumbers(Array.from(nextIncluded));
        }
        next.add(num);
      }
      setExcluded(next);
      setExcludedNumbers(Array.from(next));
    } else {
      const next = new Set(included);
      if (next.has(num)) {
        next.delete(num);
      } else {
        if (next.size >= 6) return;
        // 제외에 있으면 제거
        if (excluded.has(num)) {
          const nextExcluded = new Set(excluded);
          nextExcluded.delete(num);
          setExcluded(nextExcluded);
          setExcludedNumbers(Array.from(nextExcluded));
        }
        next.add(num);
      }
      setIncluded(next);
      setIncludedNumbers(Array.from(next));
    }
    onChanged();
  };

  const handleReset = () => {
    setExcluded(new Set());
    setIncluded(new Set());
    setExcludedNumbers([]);
    setIncludedNumbers([]);
    onChanged();
  };

  const getButtonStyle = (num: number) => {
    if (excluded.has(num)) {
      return 'bg-red-100 text-red-500 line-through dark:bg-red-900/30 dark:text-red-400';
    }
    if (included.has(num)) {
      return 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 dark:bg-blue-900/30 dark:text-blue-400';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const totalActive = excluded.size + included.size;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        번호 필터 설정
        {totalActive > 0 && (
          <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-1.5 py-0.5 rounded-full">
            {totalActive}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 animate-fade-in">
          {/* 모드 선택 탭 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('exclude')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'exclude'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              제외할 번호
              {excluded.size > 0 && ` (${excluded.size})`}
            </button>
            <button
              onClick={() => setMode('include')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'include'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              포함할 번호
              {included.size > 0 && ` (${included.size}/6)`}
            </button>
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {mode === 'exclude'
              ? '선택한 번호는 추천에서 제외됩니다.'
              : '선택한 번호는 반드시 추천에 포함됩니다. (최대 6개)'}
          </p>

          {/* 번호 그리드 */}
          <div className="grid grid-cols-9 gap-1.5">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleToggle(num)}
                className={`w-full aspect-square rounded-full text-xs font-semibold transition-all cursor-pointer hover:scale-110 ${getButtonStyle(num)}`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* 초기화 버튼 */}
          {totalActive > 0 && (
            <button
              onClick={handleReset}
              className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              전체 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
