'use client';

interface PdfGenerationResult {
    pdf: any; // jsPDF instance, typed as any to avoid direct dependency
    pageCount: number;
}

const PAGE_WIDTH_MM = 210;

const getPdfTargets = (container: HTMLElement): HTMLElement[] => {
    const pageNodes = Array.from(container.querySelectorAll<HTMLElement>('.pdf-page'));
    return pageNodes.length > 0 ? pageNodes : [container];
};

const prepareForExport = (container: HTMLElement) => {
    container.classList.add('pdf-exporting');
};

const cleanupAfterExport = (container: HTMLElement) => {
    container.classList.remove('pdf-exporting');
};

async function renderPdfFromContainer(container: HTMLElement, scale = 3): Promise<PdfGenerationResult> {
    if (!container) {
        throw new Error('PDF container is not available');
    }

    const [{default: html2canvas}, {default: jsPDF}] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
    ]);

    prepareForExport(container);

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: false
        });

        const targets = getPdfTargets(container);

        for (let index = 0; index < targets.length; index++) {
            const pageElement = targets[index];
            const canvas = await html2canvas(pageElement, {
                scale,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: pageElement.scrollWidth,
                windowHeight: pageElement.scrollHeight
            } as any);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgHeight = (canvas.height * PAGE_WIDTH_MM) / canvas.width;

            if (index > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, imgHeight, undefined, 'FAST');
        }

        return {pdf, pageCount: targets.length};
    } finally {
        cleanupAfterExport(container);
    }
}

export async function downloadPdfFromContainer(container: HTMLElement, fileName: string) {
    const {pdf, pageCount} = await renderPdfFromContainer(container);
    pdf.save(fileName);
    return pageCount;
}

export async function pdfBase64FromContainer(container: HTMLElement) {
    const {pdf, pageCount} = await renderPdfFromContainer(container);
    const base64 = pdf.output('datauristring').split(',')[1];
    return {base64, pageCount};
}

// Helper function to serialize HTML element with all styles
async function serializeElementWithStyles(element: HTMLElement): Promise<string> {
    try {
        // Clone the element to avoid modifying the original
        const clone = element.cloneNode(true) as HTMLElement;
        
        // Get all style sheets from document
        const styleSheets = Array.from(document.styleSheets);
        let styleSheetText = '';
        
        for (const sheet of styleSheets) {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                for (const rule of rules) {
                    styleSheetText += rule.cssText + '\n';
                }
            } catch (e) {
                // Cross-origin stylesheet, try to get href
                try {
                    if (sheet.href) {
                        styleSheetText += `@import url('${sheet.href}');\n`;
                    }
                } catch (e2) {
                    // Skip if cannot access
                    console.warn('Cannot access stylesheet:', e2);
                }
            }
        }
        
        // Get all style tags from document head
        try {
            const styleTags = Array.from(document.querySelectorAll('style'));
            for (const styleTag of styleTags) {
                if (styleTag.innerHTML) {
                    styleSheetText += styleTag.innerHTML + '\n';
                }
            }
        } catch (e) {
            console.warn('Error getting style tags:', e);
        }
        
        // Convert images to base64 (skip if errors)
        const images = clone.querySelectorAll('img');
        const imagePromises = Array.from(images).map(async (img) => {
            if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
                try {
                    const response = await fetch(img.src, { mode: 'cors', credentials: 'omit' });
                    if (!response.ok) {
                        console.warn('Failed to fetch image:', img.src);
                        return;
                    }
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const base64 = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    img.src = base64;
                } catch (e) {
                    console.warn('Cannot convert image to base64:', img.src, e);
                    // Keep original src if conversion fails
                }
            }
        });
        
        // Wait for all images to be converted (or fail silently)
        await Promise.allSettled(imagePromises);
        
        // Get viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || 
                             'width=device-width, initial-scale=1.0';
        
        // Create full HTML document
        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="${viewportMeta}">
    <style>
        ${styleSheetText}
        /* Ensure PDF rendering styles */
        @page {
            size: A4 portrait;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    </style>
</head>
<body>
    ${clone.outerHTML}
</body>
</html>
        `.trim();
        
        return htmlContent;
    } catch (error) {
        console.error('Error serializing element:', error);
        throw new Error(`Failed to serialize HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// New function using Puppeteer API route - generates PDF with selectable text
export async function pdfBase64FromContainerWithPuppeteer(container: HTMLElement) {
    if (!container) {
        throw new Error('PDF container is not available');
    }

    prepareForExport(container);

    try {
        // Serialize HTML element with all styles
        const htmlContent = await serializeElementWithStyles(container);

        if (!htmlContent || htmlContent.trim().length === 0) {
            throw new Error('Failed to serialize HTML content');
        }

        console.log('Calling PDF generation API...');
        
        // Call API route
        const response = await fetch('/api/pdf/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html: htmlContent,
                options: {
                    format: 'A4',
                    margin: {
                        top: '0mm',
                        right: '0mm',
                        bottom: '0mm',
                        left: '0mm',
                    },
                    printBackground: true,
                },
            }),
        });

        console.log('PDF API response status:', response.status);

        if (!response.ok) {
            let errorMessage = 'Failed to generate PDF';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || errorMessage;
                console.error('PDF API error:', error);
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error('Failed to parse error response:', e);
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('PDF API success, pageCount:', result.data?.pageCount);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to generate PDF');
        }

        if (!result.data || !result.data.base64) {
            throw new Error('Invalid PDF response from server: missing base64 data');
        }

        return {
            base64: result.data.base64,
            pageCount: result.data.pageCount || 1,
        };
    } catch (error) {
        console.error('Error in pdfBase64FromContainerWithPuppeteer:', error);
        
        // Re-throw with more context if needed
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to generate PDF: ${String(error)}`);
    } finally {
        cleanupAfterExport(container);
    }
}

// Helper function to clean and validate base64 string
function cleanBase64(base64: string): string {
    // Remove data URI prefix if present (e.g., "data:application/pdf;base64,")
    let cleaned = base64.trim();
    
    // Check if it's a data URI
    if (cleaned.includes(',')) {
        cleaned = cleaned.split(',')[1];
    }
    
    // Remove whitespace and newlines
    cleaned = cleaned.replace(/\s/g, '');
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleaned)) {
        throw new Error('Invalid base64 format');
    }
    
    return cleaned;
}

// New function to download PDF using Puppeteer
export async function downloadPdfFromContainerWithPuppeteer(container: HTMLElement, fileName: string) {
    try {
        const {base64, pageCount} = await pdfBase64FromContainerWithPuppeteer(container);
        
        if (!base64) {
            throw new Error('PDF base64 data is empty');
        }
        
        console.log('Base64 length:', base64.length);
        console.log('Base64 preview:', base64.substring(0, 50));
        
        // Clean and validate base64 string
        let cleanedBase64: string;
        try {
            cleanedBase64 = cleanBase64(base64);
        } catch (cleanError: any) {
            console.error('Error cleaning base64:', cleanError);
            throw new Error(`Invalid base64 format: ${cleanError.message}`);
        }
        
        // Convert base64 to blob and download
        let byteCharacters: string;
        try {
            byteCharacters = atob(cleanedBase64);
        } catch (decodeError: any) {
            console.error('Error decoding base64:', decodeError);
            console.error('Base64 string:', cleanedBase64.substring(0, 100));
            throw new Error(`Failed to decode base64: ${decodeError.message}`);
        }
        
        // Validate decoded data - check PDF magic number
        const pdfMagic = byteCharacters.substring(0, 4);
        if (pdfMagic !== '%PDF') {
            console.error('Invalid PDF magic number:', pdfMagic);
            throw new Error('Decoded data is not a valid PDF file');
        }
        console.log('PDF magic number validated:', pdfMagic);
        
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Validate blob
        if (blob.size === 0) {
            throw new Error('Generated PDF blob is empty');
        }
        
        console.log('PDF blob size:', blob.size);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return pageCount || 1;
    } catch (error) {
        console.error('Error downloading PDF with Puppeteer:', error);
        throw error;
    }
}

// Merge multiple PDFs using the API endpoint
export async function mergePdfsBase64(
    formPdfBase64: string, 
    attachedPdfBase64: string
): Promise<{ base64: string; pageCount: number }> {
    try {
        const response = await fetch('/api/pdf/merge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pdfs: [formPdfBase64, attachedPdfBase64]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || 'Failed to merge PDFs');
        }
        
        const result = await response.json();
        
        if (!result.mergedBase64) {
            throw new Error('Invalid response from merge API');
        }
        
        return {
            base64: result.mergedBase64,
            pageCount: result.pageCount ?? 1
        };
    } catch (error) {
        console.error('Error merging PDFs:', error);
        throw error instanceof Error ? error : new Error('Failed to merge PDFs');
    }
}