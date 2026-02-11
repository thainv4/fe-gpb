import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
    try {
        const { pdfs } = await request.json();
        
        if (!pdfs || !Array.isArray(pdfs) || pdfs.length === 0) {
            return NextResponse.json(
                { error: 'Invalid PDF data. Expected an array of base64 strings.' },
                { status: 400 }
            );
        }
        
        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();
        
        // Load and merge each PDF
        for (let i = 0; i < pdfs.length; i++) {
            try {
                const pdfBase64 = pdfs[i];
                
                if (!pdfBase64 || typeof pdfBase64 !== 'string') {
                    console.warn(`Skipping invalid PDF at index ${i}`);
                    continue;
                }
                
                // Convert base64 to bytes
                const pdfBytes = Buffer.from(pdfBase64, 'base64');
                
                // Load the PDF document
                const pdf = await PDFDocument.load(pdfBytes, {
                    ignoreEncryption: true,
                });
                
                // Copy all pages from this PDF
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                // Add each page to the merged document
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
                
            } catch (error) {
                console.error(`Error processing PDF at index ${i}:`, error);
                // Continue with other PDFs even if one fails
            }
        }
        
        // Check if we have any pages
        if (mergedPdf.getPageCount() === 0) {
            return NextResponse.json(
                { error: 'No valid PDF pages could be merged' },
                { status: 400 }
            );
        }
        
        // Save the merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const mergedBase64 = Buffer.from(mergedPdfBytes).toString('base64');
        
        return NextResponse.json({
            success: true,
            mergedBase64,
            pageCount: mergedPdf.getPageCount()
        });
        
    } catch (error) {
        console.error('Error merging PDFs:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json(
            { 
                error: 'Failed to merge PDFs',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
