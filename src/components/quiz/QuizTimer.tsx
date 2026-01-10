import { Clock } from 'lucide-react';

interface QuizTimerProps {
  time: string;
  className?: string;
}

export function QuizTimer({ time, className = '' }: QuizTimerProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-secondary-200 ${className}`}>
      <Clock size={18} className="text-accent-500" />
      <span className="font-mono text-lg font-semibold text-charcoal tabular-nums">
        {time}
      </span>
    </div>
  );
}
