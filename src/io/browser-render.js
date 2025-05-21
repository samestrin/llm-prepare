/**
 * Browser Renderer module - Uses Puppeteer to render JavaScript-heavy websites
 */

import puppeteer from 'puppeteer';

/**
 * Renders a URL using Puppeteer and returns the HTML content
 * @param {string} url - The URL to render
 * @param {Object} options - Options for rendering
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.waitTime - Wait time after load in milliseconds
 * @return {Promise<string>} The rendered HTML content
 */
export async function renderUrl(url, options = {}) {
  const timeout = options.timeout || 30000; // 30 seconds default
  const waitTime = options.waitTime || 2000; // 2 seconds default

  let browser = null;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,1024',
      ],
    });

    // Open new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 1024 });
    
    // Set user agent
    await page.setUserAgent(
        'Mozilla/5.0 (compatible; LLMPrepare/2.0; +https://github.com/samestrin/llm-prepare)',
    );

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeout,
    });

    // Wait additional time for any final JavaScript execution
    await page.waitForTimeout(waitTime);

    // Get the page content
    const content = await page.content();
    
    return content;
  } catch (error) {
    throw new Error(`Error rendering URL: ${error.message}`);
  } finally {
    // Ensure browser is closed even if an error occurs
    if (browser) {
      await browser.close();
    }
  }
}