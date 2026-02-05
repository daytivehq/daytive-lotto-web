import LottoBall from './LottoBall';

interface LottoBallGroupProps {
  numbers: number[];
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function LottoBallGroup({ numbers, size = 'md', animated = false }: LottoBallGroupProps) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center flex-nowrap">
      {numbers.map((num, index) => (
        <div
          key={num}
          className={animated ? 'animate-fade-in' : ''}
          style={{
            animationDelay: animated ? `${index * 0.1}s` : '0s',
          }}
        >
          <LottoBall number={num} size={size} />
        </div>
      ))}
    </div>
  );
}
