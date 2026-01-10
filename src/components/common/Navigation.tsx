import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from './Button';

interface NavigationProps {
    showHome?: boolean;
    showBack?: boolean;
    showNext?: boolean;
    showTimer?: boolean;
    timer?: string;
    progress?: { current: number; total: number };
    onBack?: () => void;
    onNext?: () => void;
    backDisabled?: boolean;
    nextDisabled?: boolean;
    nextLabel?: string;
    className?: string;
}

export function Navigation({
    showHome = true,
    showBack = false,
    showNext = false,
    showTimer = false,
    timer = '00:00',
    progress,
    onBack,
    onNext,
    backDisabled = false,
    nextDisabled = false,
    nextLabel = 'Tiến',
    className = '',
}: NavigationProps) {
    const navigate = useNavigate();

    return (
        <nav className={`flex items-center justify-between py-4 ${className}`}>
            {/* Left side */}
            <div className="flex items-center gap-2">
                {showHome && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/')}
                        icon={<Home size={18} />}
                    >
                        Trang chủ
                    </Button>
                )}
                {showBack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        disabled={backDisabled}
                        icon={<ChevronLeft size={18} />}
                    >
                        Lùi
                    </Button>
                )}
            </div>

            {/* Center - Progress & Timer */}
            <div className="flex items-center gap-4">
                {progress && (
                    <span className="text-sm font-medium text-gray-600">
                        Câu {progress.current}/{progress.total}
                    </span>
                )}
                {showTimer && (
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-secondary-100 px-3 py-1.5 rounded-lg">
                        <Clock size={16} className="text-accent-500" />
                        <span>{timer}</span>
                    </div>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {showNext && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNext}
                        disabled={nextDisabled}
                        icon={<ChevronRight size={18} />}
                        iconPosition="right"
                    >
                        {nextLabel}
                    </Button>
                )}
            </div>
        </nav>
    );
}
