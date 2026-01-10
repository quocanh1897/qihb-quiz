interface ProgressBarProps {
    value: number;           // 0-100
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'accent' | 'success';
    className?: string;
}

const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
};

const variantClasses = {
    primary: 'from-primary-400 to-primary-500',
    accent: 'from-accent-400 to-accent-500',
    success: 'from-success-400 to-success-500',
};

export function ProgressBar({
    value,
    showLabel = false,
    size = 'md',
    variant = 'primary',
    className = '',
}: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="font-medium text-charcoal">{Math.round(clampedValue)}%</span>
                </div>
            )}
            <div className={`w-full rounded-full bg-secondary-200 overflow-hidden ${sizeClasses[size]}`}>
                <div
                    className={`h-full bg-gradient-to-r ${variantClasses[variant]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    );
}
