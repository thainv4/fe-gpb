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
