import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
    className?: string;
    variant?: 'text' | 'card' | 'chart';
    count?: number;
}

export function SkeletonLoader({
    className,
    variant = 'card',
    count = 1,
}: SkeletonLoaderProps) {
    const skeletons = Array.from({ length: count });

    if (variant === 'text') {
        return (
            <div className={cn('space-y-2', className)}>
                {skeletons.map((_, i) => (
                    <div
                        key={i}
                        className="h-4 rounded shimmer"
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={cn('glass rounded-xl p-6', className)}>
                <div className="h-6 w-32 rounded shimmer mb-4" />
                <div className="h-64 rounded shimmer" />
            </div>
        );
    }

    // Card variant (default)
    return (
        <div className={cn('space-y-4', className)}>
            {skeletons.map((_, i) => (
                <div key={i} className="glass rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2 flex-1">
                            <div className="h-6 w-48 rounded shimmer" />
                            <div className="h-4 w-32 rounded shimmer" />
                        </div>
                        <div className="h-12 w-24 rounded shimmer" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-16 rounded shimmer" />
                        <div className="h-16 rounded shimmer" />
                        <div className="h-16 rounded shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}
