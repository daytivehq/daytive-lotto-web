interface LottoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-11 h-11 sm:w-14 sm:h-14 text-lg sm:text-xl',
};

function getBallColor(num: number): string {
  if (num <= 10) return '#FFC107'; // 노란색
  if (num <= 20) return '#2196F3'; // 파란색
  if (num <= 30) return '#F44336'; // 빨간색
  if (num <= 40) return '#9E9E9E'; // 회색
  return '#4CAF50'; // 녹색
}

export default function LottoBall({ number, size = 'md' }: LottoBallProps) {
  const sizeClass = sizeClasses[size];
  const backgroundColor = getBallColor(number);

  return (
    <div
      className={`
        ${sizeClass}
        rounded-full
        flex items-center justify-center
        text-white font-bold
        shadow-lg
        transition-transform hover:scale-110
      `}
      style={{ backgroundColor }}
    >
      {number}
    </div>
  );
}
