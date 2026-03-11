import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * Takes a viewport screenshot of a URL using headless Chromium.
 * Designed for Vercel serverless (uses @sparticuz/chromium).
 *
 * @param {string} url - The URL to screenshot
 * @param {{ width: number, height: number }} viewport - Viewport dimensions
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function takeScreenshot(url, viewport) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2, // Retina quality
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Real Chrome user-agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Small delay to let animations/fonts settle
    await new Promise((r) => setTimeout(r, 1000));

    const screenshot = await page.screenshot({
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      },
    });

    return Buffer.from(screenshot);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
