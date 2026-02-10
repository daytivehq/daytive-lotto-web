import { useState, useEffect, useCallback } from 'react';
import LottoBall from './LottoBall';
import { fetchLatestWinning, fetchMultipleRounds, type WinningData } from '@/lib/api';

function getBallColor(num: number): string {
  if (num <= 10) return '#FFC107';
  if (num <= 20) return '#2196F3';
  if (num <= 30) return '#F44336';
  if (num <= 40) return '#9E9E9E';
  return '#4CAF50';
}

interface FrequencyData {
  number: number;
  count: number;
}

function computeFrequency(rounds: WinningData[]): FrequencyData[] {
  const counts = new Array(45).fill(0);
  for (const round of rounds) {
    for (const num of round.numbers) {
      counts[num - 1]++;
    }
  }
  return counts.map((count, i) => ({ number: i + 1, count }));
}

function FrequencyBar({ data, maxCount }: { data: FrequencyData; maxCount: number }) {
  const widthPercent = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
  const color = getBallColor(data.number);

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-right text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
        {data.number}
      </span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height: '20px' }}>
        {data.count > 0 && (
          <div
            className="rounded-full"
            style={{
              width: `${widthPercent}%`,
              minWidth: '8px',
              height: '20px',
              backgroundColor: color,
            }}
          />
        )}
      </div>
      <span className="w-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
        {data.count}
      </span>
    </div>
  );
}

export default function StatsChart() {
  const [latestRound, setLatestRound] = useState<number | null>(null);
  const [roundsData, setRoundsData] = useState<{ 50: WinningData[]; 100: WinningData[] }>({ 50: [], 100: [] });
  const [activeTab, setActiveTab] = useState<50 | 100>(50);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (count: 50 | 100) => {
    setLoading(true);
    setError(null);
    setProgress({ loaded: 0, total: count });

    try {
      // 이미 해당 기간 데이터가 있으면 재사용
      if (roundsData[count].length > 0) {
        setLoading(false);
        return;
      }

      let round = latestRound;
      if (!round) {
        const latest = await fetchLatestWinning();
        round = latest.round;
        setLatestRound(round);
      }

      const data = await fetchMultipleRounds(round, count, (loaded, total) => {
        setProgress({ loaded, total });
      });

      setRoundsData(prev => {
        const next = { ...prev, [count]: data };
        // 100회 데이터가 있으면 50회 데이터는 그 subset
        if (count === 100 && prev[50].length === 0) {
          next[50] = data.slice(0, 50);
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [latestRound, roundsData]);

  useEffect(() => {
    loadData(activeTab);
  }, []);

  const handleTabChange = (tab: 50 | 100) => {
    setActiveTab(tab);
    if (roundsData[tab].length === 0) {
      loadData(tab);
    }
  };

  const currentData = roundsData[activeTab];
  const frequency = computeFrequency(currentData);
  const maxCount = Math.max(...frequency.map(f => f.count), 1);

  const sortedByCount = [...frequency].sort((a, b) => b.count - a.count || a.number - b.number);
  const hotNumbers = sortedByCount.slice(0, 6);
  const coldNumbers = sortedByCount.slice(-6).reverse();

  const roundRange = currentData.length > 0
    ? `${currentData[currentData.length - 1].round}~${currentData[0].round}회`
    : '';

  return (
    <div className="space-y-6">
      {/* 기간 필터 탭 */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => handleTabChange(50)}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
            ${activeTab === 50
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          최근 50회
        </button>
        <button
          onClick={() => handleTabChange(100)}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
            ${activeTab === 100
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          최근 100회
        </button>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center space-y-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              당첨번호 불러오는 중... ({progress.loaded}/{progress.total})
            </p>
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button onClick={() => loadData(activeTab)} className="mt-2 text-sm text-red-500 underline cursor-pointer">
            다시 시도
          </button>
        </div>
      )}

      {/* 통계 표시 */}
      {!loading && !error && currentData.length > 0 && (
        <>
          {/* 핫/콜드 번호 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5">
              <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                HOT
              </h3>
              <div className="grid grid-cols-3 gap-2 justify-items-center">
                {hotNumbers.map(h => (
                  <div key={h.number} className="flex flex-col items-center gap-0.5">
                    <LottoBall number={h.number} size="sm" />
                    <span className="text-[10px] text-gray-400">{h.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5">
              <h3 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                COLD
              </h3>
              <div className="grid grid-cols-3 gap-2 justify-items-center">
                {coldNumbers.map(c => (
                  <div key={c.number} className="flex flex-col items-center gap-0.5">
                    <LottoBall number={c.number} size="sm" />
                    <span className="text-[10px] text-gray-400">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 번호별 출현 빈도 막대 그래프 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">번호별 출현 빈도</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">{roundRange}</span>
            </div>
            <div className="space-y-1.5">
              {frequency.map(data => (
                <FrequencyBar key={data.number} data={data} maxCount={maxCount} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
