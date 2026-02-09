import { useState, useEffect } from 'react';
import LottoBallGroup from './LottoBallGroup';
import LottoBall from './LottoBall';
import { fetchLatestWinning, fetchWinningByRound, checkWinning, type WinningData, type MatchResult } from '@/lib/api';
import { getFavorites, type FavoriteItem } from '@/lib/storage';

function formatMoney(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function RankBadge({ rank }: { rank: string | null }) {
  if (!rank) return <span className="text-sm text-gray-400">낙첨</span>;

  const colors: Record<string, string> = {
    '1등': 'bg-red-500 text-white',
    '2등': 'bg-orange-500 text-white',
    '3등': 'bg-yellow-500 text-white',
    '4등': 'bg-green-500 text-white',
    '5등': 'bg-blue-500 text-white',
  };

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[rank] || 'bg-gray-200 text-gray-600'}`}>
      {rank}
    </span>
  );
}

function WinningCard({ data }: { data: WinningData }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{data.round}회</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{data.date}</span>
      </div>

      <div className="flex items-center gap-3 justify-center">
        <LottoBallGroup numbers={data.numbers} size="md" />
        <span className="text-gray-400 text-lg font-bold">+</span>
        <LottoBall number={data.bonusNumber} size="md" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <span className="block text-gray-400 dark:text-gray-500">1등 당첨금</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{formatMoney(data.firstPrize)}</span>
        </div>
        <div>
          <span className="block text-gray-400 dark:text-gray-500">1등 당첨자</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{data.firstWinners}명</span>
        </div>
      </div>
    </div>
  );
}

function FavoriteMatchItem({ item, winning }: { item: FavoriteItem; winning: WinningData }) {
  const result = checkWinning(item.numbers, winning);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <LottoBallGroup
            numbers={item.numbers}
            size="sm"
            highlightNumbers={result.matchedNumbers}
          />
        </div>
        <div className="ml-3 flex-shrink-0">
          <RankBadge rank={result.rank} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
        <span>
          {result.matchCount}개 일치
          {result.hasBonusMatch && result.matchCount >= 5 ? ' + 보너스' : ''}
        </span>
        {item.memo && <span>{item.memo}</span>}
      </div>
    </div>
  );
}

export default function WinningNumbers() {
  const [latest, setLatest] = useState<WinningData | null>(null);
  const [searched, setSearched] = useState<WinningData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'latest' | 'search'>('latest');

  useEffect(() => {
    loadLatest();
    setFavorites(getFavorites());
  }, []);

  const loadLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLatestWinning((updated) => {
        // 백그라운드에서 새 회차 데이터가 도착하면 자동 갱신
        setLatest(updated);
      });
      setLatest(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const round = parseInt(searchInput, 10);
    if (!round || round < 1) {
      setSearchError('올바른 회차 번호를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearched(null);
    try {
      const data = await fetchWinningByRound(round);
      setSearched(data);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const currentWinning = activeTab === 'search' && searched ? searched : latest;

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('latest')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
            ${activeTab === 'latest'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          최신 당첨번호
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
            ${activeTab === 'search'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          회차 검색
        </button>
      </div>

      {/* 최신 당첨번호 */}
      {activeTab === 'latest' && (
        <>
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex justify-center">
                <div className="animate-pulse flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button onClick={loadLatest} className="mt-2 text-sm text-red-500 underline cursor-pointer">
                다시 시도
              </button>
            </div>
          )}
          {latest && !loading && <WinningCard data={latest} />}
        </>
      )}

      {/* 회차 검색 */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="회차 번호 입력"
              min={1}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                         rounded-xl px-4 py-3 text-sm outline-none
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300
                         text-white font-semibold px-5 py-3 rounded-xl
                         transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {searchLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : '검색'}
            </button>
          </div>

          {searchError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{searchError}</p>
            </div>
          )}

          {searched && <WinningCard data={searched} />}
        </div>
      )}

      {/* 즐겨찾기 대조 결과 */}
      {currentWinning && favorites.length > 0 && (
        <div>
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            내 번호 대조 결과
            <span className="text-xs font-normal text-gray-400">({currentWinning.round}회 기준)</span>
          </h3>
          <div className="space-y-3">
            {favorites.map((item) => (
              <FavoriteMatchItem key={item.id} item={item} winning={currentWinning} />
            ))}
          </div>
        </div>
      )}

      {currentWinning && favorites.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
          <p>즐겨찾기에 저장된 번호가 없습니다.</p>
          <a href="/" className="text-blue-500 hover:text-blue-600 underline mt-1 inline-block">
            번호 추천받으러 가기
          </a>
        </div>
      )}
    </div>
  );
}
