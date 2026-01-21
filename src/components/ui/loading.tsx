'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface LoadingProps {
    /**
     * Hiển thị loading hay không
     */
    isLoading?: boolean;
    
    /**
     * Text hiển thị khi loading
     */
    text?: string;
    
    /**
     * Kích thước spinner (small, medium, large)
     */
    size?: 'small' | 'medium' | 'large';
    
    /**
     * Hiển thị overlay (full screen hoặc trong container)
     */
    overlay?: boolean;
    
    /**
     * Custom className
     */
    className?: string;
    
    /**
     * Children - nội dung sẽ bị blur khi loading
     */
    children?: React.ReactNode;
}

const sizeMap = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
};

export function Loading({
    isLoading = true,
    text,
    size = 'medium',
    overlay = false,
    className,
    children,
}: LoadingProps) {
    if (!isLoading) {
        return <>{children}</>;
    }

    const spinnerSize = sizeMap[size];

    if (overlay) {
        return (
            <div className={cn('relative', className)}>
                {children && (
                    <div className={cn(isLoading && 'opacity-50 pointer-events-none')}>
                        {children}
                    </div>
                )}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-50">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className={cn('animate-spin text-blue-600', spinnerSize)} />
                            {text && (
                                <p className="text-sm text-gray-600 font-medium">{text}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-blue-600', spinnerSize)} />
            {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
        </div>
    );
}

/**
 * Loading overlay component - hiển thị full screen với backdrop blur và disable toàn màn hình
 */
export function LoadingOverlay({ isLoading, text, size = 'large' }: { 
    isLoading?: boolean; 
    text?: string;
    size?: 'small' | 'medium' | 'large';
}) {
    const spinnerSize = sizeMap[size];

    // Disable scroll và tương tác khi loading
    useEffect(() => {
        if (isLoading) {
            // Lưu overflow và pointer events hiện tại
            const originalOverflow = document.body.style.overflow;
            const originalPointerEvents = document.body.style.pointerEvents;
            
            // Disable scroll và pointer events trên body
            document.body.style.overflow = 'hidden';
            document.body.style.pointerEvents = 'none';
            
            // Disable scroll trên html
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            
            return () => {
                // Restore khi unmount hoặc loading = false
                document.body.style.overflow = originalOverflow;
                document.body.style.pointerEvents = originalPointerEvents;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-[9999]"
            style={{ 
                pointerEvents: 'auto',
                touchAction: 'none',
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div 
                className="flex flex-col items-center gap-4 bg-white/90 rounded-lg shadow-lg px-8 py-6"
                onClick={(e) => e.stopPropagation()}
            >
                <Loader2 className={cn('animate-spin text-blue-600', spinnerSize)} />
                {text && (
                    <p className="text-sm text-gray-700 font-medium">{text}</p>
                )}
            </div>
        </div>
    );
}

/**
 * Loading spinner đơn giản - chỉ hiển thị spinner
 */
export function LoadingSpinner({ 
    size = 'medium', 
    className 
}: { 
    size?: 'small' | 'medium' | 'large';
    className?: string;
}) {
    const spinnerSize = sizeMap[size];
    
    return (
        <Loader2 className={cn('animate-spin text-blue-600', spinnerSize, className)} />
    );
}
