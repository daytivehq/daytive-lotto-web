import { useState, useEffect, useMemo, useRef } from 'react';
import LottoBallGroup from './LottoBallGroup';
import { getFavorites, removeFromFavorites, addToFavorites, type FavoriteItem } from '@/lib/storage';

function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toInputDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function NumberInputForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [inputs, setInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // 숫자만 허용
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 2) return;

    const next = [...inputs];
    next[index] = cleaned;
    setInputs(next);
    setError(null);

    // 2자리 입력 완료 시 다음 칸으로 자동 이동
    if (cleaned.length === 2 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // 빈칸에서 Backspace 누르면 이전 칸으로
    if (e.key === 'Backspace' && inputs[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSave = () => {
    const numbers = inputs.map(v => parseInt(v, 10));

    // 유효성 검사
    if (inputs.some(v => v === '')) {
      setError('6개 번호를 모두 입력해주세요.');
      return;
    }
    if (numbers.some(n => n < 1 || n > 45)) {
      setError('1~45 사이의 번호만 입력 가능합니다.');
      return;
    }
    if (new Set(numbers).size !== 6) {
      setError('중복된 번호가 있습니다.');
      return;
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    addToFavorites(sorted, memo || undefined);
    onSave();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-5 space-y-4">
      <div className="flex gap-1.5 sm:gap-2 justify-center">
        {inputs.map((val, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            placeholder="?"
            className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-bold
                       bg-gray-100 dark:bg-gray-700 rounded-full
                       border-2 border-transparent focus:border-blue-500
                       outline-none transition-colors"
          />
        ))}
      </div>

      <input
        type="text"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm
                   outline-none focus:ring-2 focus:ring-blue-500
                   placeholder-gray-400"
      />

      {error && (
        <p className="text-red-500 text-xs text-center">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm rounded-lg
                     bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400
                     hover:bg-gray-200 dark:hover:bg-gray-600
                     transition-colors cursor-pointer"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 text-sm rounded-lg font-semibold
                     bg-blue-500 text-white hover:bg-blue-600
                     transition-colors cursor-pointer"
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleDelete = (id: string) => {
    removeFromFavorites(id);
    setFavorites(getFavorites());
  };

  const handleInputSave = () => {
    setShowInput(false);
    setFavorites(getFavorites());
  };

  // 날짜별로 그룹핑
  const dateGroups = useMemo(() => {
    const groups: Record<string, FavoriteItem[]> = {};
    for (const item of favorites) {
      const key = toInputDate(item.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [favorites]);

  const sortedDates = useMemo(
    () => Object.keys(dateGroups).sort((a, b) => b.localeCompare(a)),
    [dateGroups]
  );

  // 필터링된 목록
  const filteredFavorites = useMemo(() => {
    if (!selectedDate) return favorites;
    return dateGroups[selectedDate] || [];
  }, [favorites, selectedDate, dateGroups]);

  if (favorites.length === 0 && !showInput) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowInput(true)}
            className="px-3 py-1.5 text-sm rounded-lg font-semibold
                       bg-blue-500 text-white hover:bg-blue-600
                       transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            직접 입력
          </button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            저장된 번호가 없습니다.
          </p>
          <a
            href="/"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            번호 추천받으러 가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 + 직접입력 영역 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDate('')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer
            ${!selectedDate
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          전체 ({favorites.length})
        </button>
        <div className="relative flex-1">
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`w-full appearance-none px-3 py-1.5 pr-8 text-sm rounded-lg transition-colors cursor-pointer outline-none
              ${selectedDate
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <option value="">날짜 선택</option>
            {sortedDates.map((date) => (
              <option key={date} value={date}>
                {toDateKey(date + 'T00:00:00')} ({dateGroups[date].length}개)
              </option>
            ))}
          </select>
          <svg
            className={`w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none
              ${selectedDate ? 'text-white' : 'text-gray-400'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1
            ${showInput
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showInput ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showInput ? '닫기' : '직접 입력'}
        </button>
      </div>

      {/* 직접 입력 폼 */}
      {showInput && (
        <NumberInputForm
          onSave={handleInputSave}
          onCancel={() => setShowInput(false)}
        />
      )}

      {/* 목록 */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          해당 날짜에 저장된 번호가 없습니다.
        </div>
      ) : (
        filteredFavorites.map((item, idx) => {
          // 날짜 구분선: 전체 보기일 때 날짜가 바뀌면 표시
          const prevDate = idx > 0 ? toInputDate(filteredFavorites[idx - 1].createdAt) : null;
          const currentDate = toInputDate(item.createdAt);
          const showDateHeader = !selectedDate && currentDate !== prevDate;

          return (
            <div key={item.id}>
              {showDateHeader && (
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {toDateKey(item.createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <LottoBallGroup numbers={item.numbers} size="sm" />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {item.memo && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {item.memo}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
