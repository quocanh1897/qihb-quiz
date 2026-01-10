import type { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export function Layout({ children, className = '' }: LayoutProps) {
    return (
        <div className={`min-h-screen bg-gradient-to-br from-secondary-100 via-white to-accent-50 ${className}`}>
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {children}
            </div>
        </div>
    );
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function PageHeader({ title, subtitle, className = '' }: PageHeaderProps) {
    return (
        <div className={`text-center mb-8 ${className}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">
                {title}
            </h1>
            {subtitle && (
                <p className="text-gray-600 text-lg">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
