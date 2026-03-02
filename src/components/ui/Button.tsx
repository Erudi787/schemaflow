import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white glow-accent',
    secondary: 'bg-bg-tertiary hover:bg-bg-hover text-text-secondary border border-border',
    ghost: 'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
    danger: 'bg-error/10 hover:bg-error/20 text-error border border-error/30',
};

const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
};

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-md transition-colors',
                variants[variant],
                sizes[size],
                disabled && 'opacity-40 pointer-events-none',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
