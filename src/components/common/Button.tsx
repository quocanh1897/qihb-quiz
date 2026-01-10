import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-400 shadow-md hover:shadow-lg',
    secondary: 'bg-secondary-200 text-charcoal hover:bg-secondary-300 focus:ring-secondary-400',
    accent: 'bg-accent-400 text-white hover:bg-accent-500 focus:ring-accent-300 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-charcoal hover:bg-secondary-100 focus:ring-secondary-300',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-400',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-400 shadow-md',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            icon,
            iconPosition = 'left',
            isLoading = false,
            fullWidth = false,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Đang tải...
                    </>
                ) : (
                    <>
                        {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
                        {children}
                        {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
