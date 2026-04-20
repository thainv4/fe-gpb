export function normalizePlainText(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{3,}/g, '  ')
        .replace(/\n[ \t]+\n/g, '\n\n')
        .trim()
}

export function htmlToPlainText(html: string | null | undefined): string {
    if (!html) return ''

    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const body = doc.body
        const blockTags = new Set([
            'P',
            'DIV',
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
            'UL',
            'OL',
            'LI',
        ])

        const walk = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent || ''
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return ''
            }

            const el = node as HTMLElement
            const tag = el.tagName

            if (tag === 'BR') {
                return '\n'
            }

            let text = ''
            for (const child of Array.from(el.childNodes)) {
                text += walk(child)
            }

            if (tag === 'LI') {
                text = `• ${text}`
            }

            if (blockTags.has(tag)) {
                text = `\n${text}\n`
            }

            return text
        }

        return normalizePlainText(walk(body))
    }

    return normalizePlainText(
        html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/?(p|div|h[1-6]|ul|ol)[^>]*>/gi, '\n')
            .replace(/<li[^>]*>/gi, '\n• ')
            .replace(/<\/li>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
    )
}
