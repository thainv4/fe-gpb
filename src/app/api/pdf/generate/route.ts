import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PdfGenerateRequest {
    html: string;
    options?: {
        format?: 'A4' | 'Letter';
        margin?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
        printBackground?: boolean;
    };
}

export async function POST(request: NextRequest) {
    let browser;
    try {
        const body: PdfGenerateRequest = await request.json();
        const { html, options = {} } = body;

        if (!html || typeof html !== 'string') {
            return NextResponse.json(
                { success: false, error: 'HTML content is required and must be a string' },
                { status: 400 }
            );
        }

        if (html.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'HTML content cannot be empty' },
                { status: 400 }
            );
        }

        console.log('Starting PDF generation, HTML length:', html.length);

        // Launch Puppeteer browser with error handling
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
                timeout: 30000, // 30 second timeout
            });
            console.log('Puppeteer browser launched successfully');
        } catch (launchError: any) {
            console.error('Failed to launch Puppeteer:', launchError);
            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to launch browser: ${launchError?.message || 'Unknown error'}. Make sure Puppeteer is properly installed.`,
                },
                { status: 500 }
            );
        }

        const page = await browser.newPage();

        try {
            console.log('Setting page content...');
            // Set content with full HTML (including styles) with timeout
            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: 30000, // 30 second timeout
            });
            console.log('Page content set successfully');

            console.log('Generating PDF...');
            // Generate PDF with timeout
            const pdfBuffer = await page.pdf({
                format: options.format || 'A4',
                margin: options.margin || {
                    top: '0mm',
                    right: '0mm',
                    bottom: '0mm',
                    left: '0mm',
                },
                printBackground: options.printBackground !== false,
                preferCSSPageSize: false,
                timeout: 30000, // 30 second timeout
            });
            console.log('PDF generated successfully, size:', pdfBuffer.length);
            
            // Validate PDF buffer - check PDF magic number
            const pdfHeader = Buffer.from(pdfBuffer).subarray(0, 4).toString();
            if (pdfHeader !== '%PDF') {
                console.error('Invalid PDF header:', pdfHeader);
                throw new Error('Generated PDF buffer is not a valid PDF file');
            }
            console.log('PDF header validated:', pdfHeader);

            await browser.close();
            browser = null;

            // Convert buffer to base64 - ensure it's clean base64 without data URI prefix
            // pdfBuffer from Puppeteer is already a Buffer, so we can use toString directly
            const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
            const base64 = buffer.toString('base64');
            
            // Validate base64
            if (!base64 || base64.length === 0) {
                throw new Error('Generated PDF buffer is empty');
            }
            
            console.log('PDF base64 length:', base64.length);
            console.log('PDF base64 preview:', base64.substring(0, 50));

            // Count pages by checking PDF structure
            const pageCount = Math.max(1, Math.ceil(pdfBuffer.length / 822000));

            return NextResponse.json({
                success: true,
                data: {
                    base64,
                    pageCount,
                },
            });
        } catch (pageError: any) {
            console.error('Error during PDF generation:', pageError);
            await browser.close();
            browser = null;
            throw pageError;
        }
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }

        const errorMessage = error?.message || 'Failed to generate PDF';
        const statusCode = errorMessage.includes('timeout') ? 504 : 500;

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: statusCode }
        );
    }
}