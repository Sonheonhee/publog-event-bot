import { VerificationStatus } from '@/types/stock';
import { dataVerificationService } from '@/services/dataVerification';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
    status: VerificationStatus;
    className?: string;
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
    const badgeText = dataVerificationService.getVerificationBadge(status);
    const colorClass = dataVerificationService.getVerificationColor(status);

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                'glass border',
                className
            )}
        >
            <span className={cn('text-sm', colorClass)}>
                {status.isVerified ? '✓' : '⚠'}
            </span>
            <span className={colorClass}>{badgeText}</span>
            <span className="text-gray-400">
                {status.confidence}%
            </span>
        </div>
    );
}
