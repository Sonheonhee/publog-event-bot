'use client';

import { useNotification } from '@/hooks/useNotification';
import { motion } from 'framer-motion';

interface NotificationButtonProps {
    enabled: boolean;
    onToggle: () => void;
    label?: string;
}

export function NotificationButton({ enabled, onToggle, label = '알림' }: NotificationButtonProps) {
    const { permission, isSupported, requestPermission } = useNotification();

    const handleClick = async () => {
        if (!isSupported) {
            alert('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        if (permission === 'denied') {
            alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
            return;
        }

        if (permission === 'default') {
            const result = await requestPermission();
            if (result !== 'granted') {
                alert('알림을 받으려면 권한을 허용해주세요.');
                return;
            }
        }

        onToggle();
    };

    return (
        <motion.button
            onClick={handleClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                font-semibold text-sm transition-all
                ${enabled
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/50'
                    : 'bg-gray-700/30 text-gray-400 border border-gray-600/50'
                }
                hover:scale-105 active:scale-95
                backdrop-blur-sm
            `}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
        >
            <motion.span
                animate={{
                    scale: enabled ? [1, 1.2, 1] : 1,
                }}
                transition={{
                    duration: 0.5,
                    repeat: enabled ? Infinity : 0,
                    repeatDelay: 2,
                }}
            >
                {enabled ? '🔔' : '🔕'}
            </motion.span>
            <span>{label}</span>
            {enabled && (
                <motion.span
                    className="w-2 h-2 bg-indigo-400 rounded-full"
                    animate={{
                        opacity: [1, 0.3, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                    }}
                />
            )}
        </motion.button>
    );
}
