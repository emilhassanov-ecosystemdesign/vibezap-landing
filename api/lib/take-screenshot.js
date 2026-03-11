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
  const isMobile = viewport.width <= 500;
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2, // Retina quality
        isMobile,
        hasTouch: isMobile,
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set appropriate user agent based on device type
    await page.setUserAgent(
      isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // For mobile viewports, inject mobile-optimized classes for platforms
    // like Wix that use JS class-based responsive switching instead of CSS media queries
    if (isMobile) {
      await page.evaluate(() => {
        document.body.classList.add("device-mobile-optimized");
        document.documentElement.classList.add("device-mobile-optimized");
        const siteRoot = document.getElementById("site-root");
        if (siteRoot) siteRoot.classList.add("device-mobile-optimized");
      });
    }

    // Delay to let animations/fonts/re-render settle
    await new Promise((r) => setTimeout(r, 2000));

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
