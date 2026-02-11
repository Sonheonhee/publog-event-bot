import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'strong';
    hover?: boolean;
    glow?: boolean;
    style?: React.CSSProperties;
}

export function GlassCard({
    children,
    className,
    variant = 'default',
    hover = false,
    glow = false,
    style,
}: GlassCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl',
                variant === 'strong' ? 'glass-strong' : 'glass',
                hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                glow && 'glow',
                className
            )}
            style={style}
        >
            {children}
        </div>
    );
}
