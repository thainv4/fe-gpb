'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const clampClassByLines: Record<number, string> = {
    1: 'line-clamp-1',
    2: 'line-clamp-2',
    3: 'line-clamp-3',
    4: 'line-clamp-4',
    5: 'line-clamp-5',
    6: 'line-clamp-6',
}

interface ExpandableClampTextProps {
    text: string
    collapsedLines?: number
    className?: string
    buttonClassName?: string
    emptyText?: string
    preventToggleBubble?: boolean
    autoExpandIfHiddenLinesAtMost?: number
    /** Khi true: có overflow là tự bung toàn bộ (ưu tiên kết luận), không bắt bấm Xem đầy đủ */
    preferAutoExpand?: boolean
}

export function ExpandableClampText({
    text,
    collapsedLines = 3,
    className,
    buttonClassName,
    emptyText = '---',
    preventToggleBubble = false,
    autoExpandIfHiddenLinesAtMost = 1,
    preferAutoExpand = false,
}: ExpandableClampTextProps) {
    const contentRef = useRef<HTMLDivElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hasOverflow, setHasOverflow] = useState(false)
    const [isAutoExpanded, setIsAutoExpanded] = useState(false)

    useEffect(() => {
        setIsExpanded(false)
        setHasOverflow(false)
        setIsAutoExpanded(false)
    }, [text, collapsedLines, preferAutoExpand])

    useEffect(() => {
        if (isExpanded && !isAutoExpanded) return

        const checkOverflow = () => {
            const el = contentRef.current
            if (!el) return
            const overflowPx = el.scrollHeight - el.clientHeight
            const overflow = overflowPx > 1

            if (!overflow) {
                setHasOverflow(false)
                return
            }

            const computed = window.getComputedStyle(el)
            const parsedLineHeight = Number.parseFloat(computed.lineHeight)
            const parsedFontSize = Number.parseFloat(computed.fontSize)
            const lineHeight = Number.isFinite(parsedLineHeight)
                ? parsedLineHeight
                : Number.isFinite(parsedFontSize)
                    ? parsedFontSize * 1.5
                    : 20
            const hiddenLines = overflowPx / lineHeight

            if (
                !isExpanded &&
                (preferAutoExpand || hiddenLines <= autoExpandIfHiddenLinesAtMost)
            ) {
                setIsAutoExpanded(true)
                setIsExpanded(true)
                setHasOverflow(false)
                return
            }

            setHasOverflow(true)
        }

        checkOverflow()

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(checkOverflow)
            if (contentRef.current) observer.observe(contentRef.current)
            return () => observer.disconnect()
        }

        window.addEventListener('resize', checkOverflow)
        return () => window.removeEventListener('resize', checkOverflow)
    }, [
        text,
        collapsedLines,
        isExpanded,
        isAutoExpanded,
        autoExpandIfHiddenLinesAtMost,
        preferAutoExpand,
    ])

    const clampClass = clampClassByLines[collapsedLines] || clampClassByLines[3]
    const displayText = text || emptyText
    const showToggle = Boolean(text) && (hasOverflow || (isExpanded && !isAutoExpanded))

    return (
        <div>
            <div
                ref={contentRef}
                className={cn(
                    'whitespace-pre-wrap break-words [overflow-wrap:anywhere]',
                    !isExpanded && clampClass,
                    className
                )}
            >
                {displayText}
            </div>
            {showToggle && (
                <button
                    type="button"
                    title={isExpanded ? 'Thu gọn' : 'Xem đầy đủ'}
                    className={cn(
                        'mt-1 inline-flex items-center gap-1 text-xs text-medical-700 hover:underline',
                        buttonClassName
                    )}
                    onClick={(e) => {
                        if (preventToggleBubble) {
                            e.stopPropagation()
                        }
                        setIsAutoExpanded(false)
                        setIsExpanded((prev) => !prev)
                    }}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-3 w-3" />
                            Thu gọn
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3" />
                            Xem đầy đủ
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
