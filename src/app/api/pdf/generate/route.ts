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
            // Try to launch with default settings first
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
            
            // Check if it's a Chrome not found error
            const errorMessage = launchError?.message || '';
            if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('Chrome')) {
                // Try to find Chrome in common Windows locations
                const chromePaths = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
                    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
                    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
                ];
                
                let chromePath: string | undefined;
                const fs = await import('fs');
                for (const chromePathOption of chromePaths) {
                    try {
                        if (chromePathOption && fs.existsSync(chromePathOption)) {
                            chromePath = chromePathOption;
                            console.log('Found Chrome at:', chromePath);
                            break;
                        }
                    } catch (e) {
                        // Continue searching
                    }
                }
                
                if (chromePath) {
                    // Retry with found Chrome path
                    try {
                        browser = await puppeteer.launch({
                            executablePath: chromePath,
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
                            timeout: 30000,
                        });
                        console.log('Puppeteer browser launched successfully with system Chrome');
                    } catch (retryError: any) {
                        return NextResponse.json(
                            {
                                success: false,
                                error: `Chrome browser not found. Please run: npx puppeteer browsers install chrome\n\nOr install Chrome manually. Error: ${retryError?.message || 'Unknown error'}`,
                            },
                            { status: 500 }
                        );
                    }
                } else {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Chrome browser not found. Please run: npx puppeteer browsers install chrome\n\nOr install Chrome manually and set PUPPETEER_EXECUTABLE_PATH environment variable.`,
                        },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Failed to launch browser: ${errorMessage}. Make sure Puppeteer is properly installed.`,
                    },
                    { status: 500 }
                );
            }
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

            // Count pages by checking .pdf-page elements in the HTML
            let pageCount = 1;
            try {
                const pdfPageElements = await page.$$('.pdf-page');
                if (pdfPageElements && pdfPageElements.length > 0) {
                    pageCount = pdfPageElements.length;
                    console.log('PDF page count (from .pdf-page elements):', pageCount);
                } else {
                    // If no .pdf-page elements, check if content might span multiple pages
                    // by checking the page height
                    const bodyHeight = await page.evaluate(() => {
                        return document.body.scrollHeight;
                    });
                    const viewportHeight = await page.evaluate(() => {
                        return window.innerHeight;
                    });
                    // A4 height in pixels at 96 DPI ≈ 1123px
                    const a4HeightPx = 1123;
                    if (bodyHeight > a4HeightPx) {
                        pageCount = Math.ceil(bodyHeight / a4HeightPx);
                        console.log('PDF page count (estimated from content height):', pageCount);
                    }
                }
            } catch (countError: any) {
                console.warn('Failed to count pages from DOM, will parse PDF buffer:', countError?.message);
            }

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

            // If pageCount was not determined from DOM, try parsing PDF buffer as fallback
            if (pageCount === 1) {
                try {
                    // Convert buffer to string for parsing
                    const pdfString = pdfBuffer.toString('latin1'); // Use latin1 to preserve binary data
                    
                    // Method 1: Look for /Type /Page or /Type/Page (most reliable)
                    const pageTypeMatches = pdfString.match(/\/Type[\s\/]*\/Page[^a-zA-Z]/g);
                    if (pageTypeMatches && pageTypeMatches.length > 0) {
                        pageCount = pageTypeMatches.length;
                        console.log('PDF page count (from /Type/Page in buffer):', pageCount);
                    } else {
                        // Method 2: Look for /Count in root Pages dictionary
                        const countMatches = pdfString.match(/\/Count[\s]*(\d+)/g);
                        if (countMatches && countMatches.length > 0) {
                            const counts = countMatches.map(m => {
                                const numMatch = m.match(/(\d+)/);
                                return numMatch ? parseInt(numMatch[1], 10) : 0;
                            });
                            const maxCount = Math.max(...counts);
                            if (maxCount > 0) {
                                pageCount = maxCount;
                                console.log('PDF page count (from /Count in buffer):', pageCount);
                            }
                        }
                    }
                } catch (parseError: any) {
                    console.warn('Failed to parse PDF buffer for page count:', parseError?.message);
                }
            }
            
            // Final validation: ensure pageCount is at least 1
            if (pageCount < 1) {
                pageCount = 1;
            }
            
            console.log('Final PDF page count:', pageCount);

            return NextResponse.json({
                success: true,
                data: {
                    base64,
                    pageCount,
                },
            });
        } catch (pageError: any) {
            console.error('Error during PDF generation:', pageError);
            if (browser) {
                try {
                    await browser.close();
                } catch (closeError) {
                    console.error('Error closing browser:', closeError);
                }
            }
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