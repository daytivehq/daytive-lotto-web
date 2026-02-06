import LottoBall from './LottoBall';

interface LottoBallGroupProps {
  numbers: number[];
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  highlightNumbers?: number[];
}

export default function LottoBallGroup({ numbers, size = 'md', animated = false, highlightNumbers }: LottoBallGroupProps) {
  const hasHighlight = highlightNumbers && highlightNumbers.length > 0;

  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center flex-nowrap">
      {numbers.map((num, index) => {
        const isMatch = hasHighlight && highlightNumbers.includes(num);
        return (
          <div
            key={num}
            className={animated ? 'animate-fade-in' : ''}
            style={{
              animationDelay: animated ? `${index * 0.1}s` : '0s',
            }}
          >
            <LottoBall
              number={num}
              size={size}
              dimmed={hasHighlight ? !isMatch : false}
              highlighted={isMatch || false}
            />
          </div>
        );
      })}
    </div>
  );
}
