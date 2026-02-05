import { useState, useEffect } from 'react';
import LottoBallGroup from './LottoBallGroup';
import { getFavorites, removeFromFavorites, type FavoriteItem } from '@/lib/storage';

export default function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleDelete = (id: string) => {
    removeFromFavorites(id);
    setFavorites(getFavorites());
  };

  if (favorites.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <LottoBallGroup numbers={item.numbers} size="sm" />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString('ko-KR')}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-400 hover:text-red-500 p-1 transition-colors"
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
      ))}
    </div>
  );
}
